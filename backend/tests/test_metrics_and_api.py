import pytest
import math
from fastapi.testclient import TestClient
from app.services.metrics_service import metrics_service
from app.schemas.models import IntervalRecord
from app.main import app

client = TestClient(app)

def test_metrics_calculation_standard():
    # 4 matched observations with known errors:
    # 1: forecast 100, actual 90  -> err = +10, abs = 10, sq = 100
    # 2: forecast 200, actual 220 -> err = -20, abs = 20, sq = 400
    # 3: forecast 150, actual 150 -> err = 0,   abs = 0,  sq = 0
    # 4: forecast 300, actual 250 -> err = +50, abs = 50, sq = 2500
    # Total abs = 80 -> MAE = 80 / 4 = 20.0
    # Total err = 40 -> Bias = 40 / 4 = +10.0
    # Total sq = 3000 -> MSE = 750 -> RMSE = sqrt(750) = 27.386...
    records = [
        IntervalRecord(
            interval_index=1, settlement_date="2026-01-16",
            start_time="2026-01-16T00:00:00Z", end_time="2026-01-16T01:00:00Z",
            granularity="hourly", forecast_mw=100.0, actual_mw=90.0,
            forecast_error_mw=10.0, absolute_error_mw=10.0, status="matched"
        ),
        IntervalRecord(
            interval_index=2, settlement_date="2026-01-16",
            start_time="2026-01-16T01:00:00Z", end_time="2026-01-16T02:00:00Z",
            granularity="hourly", forecast_mw=200.0, actual_mw=220.0,
            forecast_error_mw=-20.0, absolute_error_mw=20.0, status="matched"
        ),
        IntervalRecord(
            interval_index=3, settlement_date="2026-01-16",
            start_time="2026-01-16T02:00:00Z", end_time="2026-01-16T03:00:00Z",
            granularity="hourly", forecast_mw=150.0, actual_mw=150.0,
            forecast_error_mw=0.0, absolute_error_mw=0.0, status="matched"
        ),
        IntervalRecord(
            interval_index=4, settlement_date="2026-01-16",
            start_time="2026-01-16T03:00:00Z", end_time="2026-01-16T04:00:00Z",
            granularity="hourly", forecast_mw=300.0, actual_mw=250.0,
            forecast_error_mw=50.0, absolute_error_mw=50.0, status="matched"
        ),
        # 5: Missing actual - must NOT affect calculations
        IntervalRecord(
            interval_index=5, settlement_date="2026-01-16",
            start_time="2026-01-16T04:00:00Z", end_time="2026-01-16T05:00:00Z",
            granularity="hourly", forecast_mw=400.0, actual_mw=None,
            forecast_error_mw=None, absolute_error_mw=None, status="missing_actual"
        )
    ]

    metrics = metrics_service.calculate_accuracy_metrics(records)
    assert metrics.matched_intervals == 4
    assert metrics.missing_intervals == 1
    assert metrics.mae_mw == 20.0
    assert metrics.bias_mw == 10.0
    assert metrics.rmse_mw == round(math.sqrt(750), 2)
    assert metrics.coverage_percentage == 80.0

def test_genuine_zero_generation_and_mape():
    # Observation with 0 MW actual generation (calm wind)
    # MAPE must handle or exclude zero to avoid division by zero error
    records = [
        IntervalRecord(
            interval_index=1, settlement_date="2026-01-16",
            start_time="2026-01-16T00:00:00Z", end_time="2026-01-16T01:00:00Z",
            granularity="hourly", forecast_mw=10.0, actual_mw=0.0,
            forecast_error_mw=10.0, absolute_error_mw=10.0, status="matched"
        ),
        IntervalRecord(
            interval_index=2, settlement_date="2026-01-16",
            start_time="2026-01-16T01:00:00Z", end_time="2026-01-16T02:00:00Z",
            granularity="hourly", forecast_mw=100.0, actual_mw=80.0,
            forecast_error_mw=20.0, absolute_error_mw=20.0, status="matched"
        )
    ]

    metrics = metrics_service.calculate_accuracy_metrics(records)
    assert metrics.matched_intervals == 2
    assert metrics.mae_mw == 15.0  # (10 + 20) / 2
    assert metrics.bias_mw == 15.0
    # For actual > 0, only record 2 contributes: (20 / 80) * 100 = 25.0%
    assert metrics.mape_percent == 25.0

def test_empty_dataset():
    metrics = metrics_service.calculate_accuracy_metrics([])
    assert metrics.matched_intervals == 0
    assert metrics.mae_mw is None
    assert metrics.rmse_mw is None
    assert metrics.bias_mw is None
    assert metrics.coverage_percentage == 0.0

def test_api_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "REint AI" in data["service"]

def test_api_metadata():
    resp = client.get("/api/metadata")
    assert resp.status_code == 200
    data = resp.json()
    assert data["project_name"] == "REint AI"
    assert data["generation_units"] == "Megawatts (MW)"
    assert len(data["data_sources"]) == 2

def test_api_validation_invalid_date():
    resp = client.get("/api/forecast?date=not-a-date")
    assert resp.status_code == 400
    assert "Invalid date" in resp.json()["detail"]

def test_api_validation_invalid_granularity():
    resp = client.get("/api/forecast?date=2026-01-16&granularity=weekly")
    assert resp.status_code == 422  # Pydantic regex validation failure
