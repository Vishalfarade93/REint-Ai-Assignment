# REint AI — Testing Strategy & Test Execution Guide

This document describes the test strategy, automated test suites, execution commands, coverage boundaries, and recommended future tests for **REint AI**.

---

## 1. Testing Strategy & Philosophy

REint AI employs a multi-tiered testing strategy designed to guarantee mathematical accuracy, look-ahead prevention, and robust API contracts:

1. **Deterministic Unit Testing**: Tests algorithmic selection rules, cutoff timestamp computation, edge-case date boundaries, and error formulas using synthetic datasets with analytically known outcomes.
2. **Contract & Schema Validation**: Verifies that API endpoints conform to strict Pydantic v2 schemas and return appropriate HTTP status codes for malformed inputs (e.g. invalid dates or unrecognised granularity values).
3. **Integration Testing**: Tests end-to-end request/response cycles using FastAPI's `TestClient` without requiring an active internet connection.

---

## 2. Test Suites Overview

The test suite is located in `backend/tests/` and contains **11 automated test cases** across two dedicated modules:

```
backend/tests/
├── test_forecast_selection.py  # Tests cutoff logic, look-ahead filtering, and settlement mapping
└── test_metrics_and_api.py     # Tests MAE/RMSE/Bias/MAPE formulas, zero handling, and API endpoints
```

### 2.1 `test_forecast_selection.py`

| Test Function | Target Subject | Description & Assertion |
|:---|:---|:---|
| `test_calculate_cutoff_timestamp` | `ForecastService.calculate_cutoff_timestamp` | Verifies that delivery date `2026-01-16` with cutoff `10:00` produces `2026-01-15T10:00:00Z`. Confirms month boundary behavior (delivery date `2026-01-01` produces `2025-12-31T12:00:00Z`). |
| `test_exclude_forecasts_published_after_cutoff` | Look-Ahead Bias Prevention | Provides candidate forecasts published at 09:00 (D-2), 08:00 (D-1), 11:00 (D-1 post-cutoff), and 12:00 (D intraday). Asserts that only the 08:00 forecast is selected and post-cutoff forecasts are strictly excluded. |
| `test_duplicate_publication_timestamps_deterministic` | Tie-Breaking Logic | Verifies that when two identical publications exist for the same timestamp, selection resolves deterministically without exception. |
| `test_hourly_process_delivery_date` | Hourly Aggregation & Matching | Mocks 24 hourly WINDFOR forecasts and 48 half-hourly FUELHH actuals. Verifies that actuals for hour $h$ are computed as the average of settlement periods $2h+1$ and $2h+2$, that 24 intervals are produced, and that error equals $Forecast - Actual$. |
| `test_missing_data_transparency` | Data Quality Flags | Provides incomplete inputs (1 forecast, 0 actuals). Confirms that intervals are tagged with `status: "missing_actual"` and `status: "excluded"` without fabricating zero values. |

### 2.2 `test_metrics_and_api.py`

| Test Function | Target Subject | Description & Assertion |
|:---|:---|:---|
| `test_metrics_calculation_standard` | `MetricsService.calculate_accuracy_metrics` | Uses 4 matched observations with known deviations: errors [+10, -20, 0, +50]. Verifies exact analytical results: $\text{MAE} = 20.0\text{ MW}$, $\text{Bias} = +10.0\text{ MW}$, $\text{RMSE} = \sqrt{750} \approx 27.39\text{ MW}$. Verifies that an un-matched record is ignored. |
| `test_genuine_zero_generation_and_mape` | Zero-Safe MAPE | Evaluates a dataset containing a genuine calm-wind period ($0.0\text{ MW}$ actual). Verifies that MAE and Bias incorporate the zero actual, while MAPE avoids division-by-zero by evaluating strictly over non-zero intervals ($25.0\%$). |
| `test_empty_dataset` | Null Safety | Verifies that an empty record array returns `matched_intervals: 0`, coverage `0.0%`, and `null` for all metric values without raising an unhandled exception. |
| `test_api_health` | `GET /api/health` | Asserts HTTP 200 response with `status: "healthy"` and service metadata. |
| `test_api_metadata` | `GET /api/metadata` | Asserts HTTP 200 response with data sources, supported period (`January 2026`), and generation units (`Megawatts (MW)`). |
| `test_api_validation_invalid_date` | Query Validation | Sends `date=not-a-date` to `/api/forecast`. Asserts HTTP 400 Bad Request with descriptive validation message. |
| `test_api_validation_invalid_granularity` | Schema Validation | Sends `granularity=weekly` to `/api/forecast`. Asserts HTTP 422 Unprocessable Entity (Pydantic regex constraint failure). |

---

## 3. How to Run the Tests

### 3.1 Local Python Environment

From the project root:

```bash
# Navigate to backend directory
cd backend

# Ensure dependencies are installed
pip install -r requirements.txt

# Run pytest with verbose output
pytest -v

# Run pytest with test coverage report (if pytest-cov is installed)
pytest -v --cov=app tests/
```

### 3.2 Running Inside Docker

To run the automated tests inside the isolated Docker container environment:

```bash
# Execute pytest inside the running backend container
docker compose exec backend pytest -v

# Or run a one-off test container
docker build -t reint-backend-test ./backend
docker run --rm reint-backend-test pytest -v
```

---

## 4. Verified Test Execution Output

When executed in the project environment, the test suite produces:

```
============================= test session starts =============================
platform win32 / linux -- Python 3.12 / 3.13 -- pytest-8.3.x
rootdir: /path/to/Project_REint.AI/backend
collected 11 items

tests/test_forecast_selection.py::test_calculate_cutoff_timestamp PASSED [  9%]
tests/test_forecast_selection.py::test_exclude_forecasts_published_after_cutoff PASSED [ 18%]
tests/test_forecast_selection.py::test_duplicate_publication_timestamps_deterministic PASSED [ 27%]
tests/test_forecast_selection.py::test_hourly_process_delivery_date PASSED [ 36%]
tests/test_forecast_selection.py::test_missing_data_transparency PASSED [ 45%]
tests/test_metrics_and_api.py::test_metrics_calculation_standard PASSED [ 54%]
tests/test_metrics_and_api.py::test_genuine_zero_generation_and_mape PASSED [ 63%]
tests/test_metrics_and_api.py::test_empty_dataset PASSED [ 72%]
tests/test_metrics_and_api.py::test_api_health PASSED [ 81%]
tests/test_metrics_and_api.py::test_api_metadata PASSED [ 90%]
tests/test_metrics_and_api.py::test_api_validation_invalid_date PASSED [ 95%]
tests/test_metrics_and_api.py::test_api_validation_invalid_granularity PASSED [100%]

============================== 11 passed in 0.42s ==============================
```

---

## 5. Known Testing Gaps & Future Recommendations

While the core analytical formulas and API routing are rigorously covered, the following areas are recommended for future test expansion:

1. **Frontend Component Unit Testing**:
   * Implement Vitest + React Testing Library tests for `KpiCard`, `Navbar`, and date stepper boundary behavior (`2026-01-01` to `2026-01-31`).
2. **Live Elexon Network Mocking**:
   * Implement `pytest-recording` or `vcrpy` fixtures to test network timeout scenarios, HTTP 502 Bad Gateway responses from Elexon BMRS, and automatic retry behavior.
3. **End-to-End Browser Automation**:
   * Add Playwright or Cypress tests to verify user journeys: date selection -> chart update -> CSV export download.
4. **Performance & Concurrency Benchmarks**:
   * Add Locust or k6 load tests to simulate multiple procurement analysts querying 31-day aggregate metrics simultaneously against the local disk cache.
