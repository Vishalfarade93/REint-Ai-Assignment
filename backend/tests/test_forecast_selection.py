import pytest
from app.services.forecast_service import forecast_service

def test_calculate_cutoff_timestamp():
    # Day-Ahead cutoff for delivery date 2026-01-16 with cutoff 10:00 UTC is 2026-01-15T10:00:00Z
    cutoff = forecast_service.calculate_cutoff_timestamp("2026-01-16", "10:00")
    assert cutoff == "2026-01-15T10:00:00Z"

    # Edge case: 1st of the month (month boundary D-1)
    cutoff_month_edge = forecast_service.calculate_cutoff_timestamp("2026-01-01", "12:00")
    assert cutoff_month_edge == "2025-12-31T12:00:00Z"

def test_exclude_forecasts_published_after_cutoff():
    cutoff = "2026-01-15T10:00:00Z"
    target_interval = "2026-01-16T14:00:00Z"

    # Candidate forecasts for target_interval
    candidates = [
        {"dataset": "WINDFOR", "publishTime": "2026-01-14T09:00:00Z", "startTime": target_interval, "generation": 2800.0},
        {"dataset": "WINDFOR", "publishTime": "2026-01-15T08:00:00Z", "startTime": target_interval, "generation": 3100.0},
        # Published AFTER cutoff -> MUST BE EXCLUDED:
        {"dataset": "WINDFOR", "publishTime": "2026-01-15T11:00:00Z", "startTime": target_interval, "generation": 3300.0},
        {"dataset": "WINDFOR", "publishTime": "2026-01-16T12:00:00Z", "startTime": target_interval, "generation": 3500.0},
    ]

    selected = forecast_service.select_latest_eligible_forecasts(candidates, cutoff)
    
    assert target_interval in selected
    assert selected[target_interval]["publishTime"] == "2026-01-15T08:00:00Z"
    assert selected[target_interval]["generation"] == 3100.0
    # Must NOT select 3300.0 or 3500.0
    assert selected[target_interval]["generation"] != 3300.0

def test_duplicate_publication_timestamps_deterministic():
    cutoff = "2026-01-15T10:00:00Z"
    target_interval = "2026-01-16T10:00:00Z"

    candidates = [
        {"dataset": "WINDFOR", "publishTime": "2026-01-15T09:30:00Z", "startTime": target_interval, "generation": 4000.0},
        {"dataset": "WINDFOR", "publishTime": "2026-01-15T09:30:00Z", "startTime": target_interval, "generation": 4000.0},
    ]

    selected = forecast_service.select_latest_eligible_forecasts(candidates, cutoff)
    assert selected[target_interval]["generation"] == 4000.0
    assert selected[target_interval]["publishTime"] == "2026-01-15T09:30:00Z"

def test_hourly_process_delivery_date():
    delivery_date = "2026-01-16"
    cutoff_time = "10:00"

    # Mock forecasts for 24 hours
    raw_forecasts = []
    for h in range(24):
        st = f"2026-01-16T{h:02d}:00:00Z"
        raw_forecasts.append({
            "dataset": "WINDFOR",
            "publishTime": "2026-01-15T09:30:00Z",
            "startTime": st,
            "generation": 5000.0 + h * 100.0
        })

    # Mock actuals for 48 half-hourly settlement periods
    raw_actuals = []
    for sp in range(1, 49):
        h = (sp - 1) // 2
        m = 0 if sp % 2 != 0 else 30
        st = f"2026-01-16T{h:02d}:{m:02d}:00Z"
        raw_actuals.append({
            "dataset": "FUELHH",
            "fuelType": "WIND",
            "settlementDate": delivery_date,
            "settlementPeriod": sp,
            "startTime": st,
            "generation": 4800.0 + h * 100.0 + (50.0 if m == 30 else 0.0)
        })

    resp = forecast_service.process_delivery_date(
        delivery_date=delivery_date,
        cutoff_time=cutoff_time,
        granularity="hourly",
        raw_forecasts=raw_forecasts,
        raw_actuals=raw_actuals
    )

    assert resp.delivery_date == delivery_date
    assert resp.granularity == "hourly"
    assert len(resp.records) == 24
    assert resp.summary.valid_forecast_intervals == 24
    assert resp.summary.valid_actual_intervals == 24
    assert resp.summary.matched_intervals == 24

    # Check interval 0:
    # forecast = 5000.0
    # actual = (4800.0 + 4850.0) / 2 = 4825.0
    # error = 5000.0 - 4825.0 = 175.0
    r0 = resp.records[0]
    assert r0.forecast_mw == 5000.0
    assert r0.actual_mw == 4825.0
    assert r0.forecast_error_mw == 175.0
    assert r0.absolute_error_mw == 175.0
    assert r0.status == "matched"

def test_missing_data_transparency():
    delivery_date = "2026-01-16"
    cutoff_time = "10:00"

    # Only 1 forecast, no actuals
    raw_forecasts = [{
        "dataset": "WINDFOR",
        "publishTime": "2026-01-15T09:30:00Z",
        "startTime": "2026-01-16T00:00:00Z",
        "generation": 6000.0
    }]
    raw_actuals = []

    resp = forecast_service.process_delivery_date(
        delivery_date=delivery_date,
        cutoff_time=cutoff_time,
        granularity="hourly",
        raw_forecasts=raw_forecasts,
        raw_actuals=raw_actuals
    )

    assert len(resp.records) == 24
    r0 = resp.records[0]
    assert r0.status == "missing_actual"
    assert r0.forecast_mw == 6000.0
    assert r0.actual_mw is None
    assert r0.forecast_error_mw is None

    r1 = resp.records[1]
    assert r1.status == "excluded"
    assert r1.forecast_mw is None
    assert r1.actual_mw is None
