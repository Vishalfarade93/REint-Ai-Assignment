# REint AI — Data Methodology & Algorithmic Governance

This document describes the mathematical definitions, data processing algorithms, temporal alignment techniques, and governance principles implemented in **REint AI** to evaluate UK day-ahead wind generation forecasts without look-ahead bias.

---

## 1. Domain Problem & Context

In the Great Britain (GB) electricity market, balancing supply and demand requires procurement decisions in the wholesale market ahead of real-time physical delivery.

Utility power buyers and traders procure electricity in the **Day-Ahead Market (DAM)** to cover projected consumer demand. Because wind energy has near-zero marginal production cost, it is dispatched first in the economic merit order. The volume of conventional thermal generation (e.g., CCGT gas plants) or storage that a utility must procure depends directly on the expected wind volume:

$$\text{Residual Procurement Demand} = \text{Consumer Demand} - \text{Renewable Generation}$$

Day-ahead wholesale market auctions and gate closures occur on **D-1** (the day prior to delivery day **D**), typically around **10:00 to 12:00 UTC** (depending on the auction platform, such as EPEX SPOT or Nord Pool). 

Consequently, procurement teams must commit capital based on the wind generation forecasts available **at or before gate closure**.

---

## 2. Preventing Look-Ahead Bias

### 2.1 The Nature of Look-Ahead Bias

A common flaw in naive forecast evaluation systems is using the *last forecast published prior to physical delivery* (e.g., an intraday forecast issued 2 hours before the wind blows). While that forecast is useful for real-time balancing, it **did not exist** when the day-ahead purchasing commitment was executed. Evaluating a day-ahead procurement strategy against intraday forecasts creates severe **look-ahead bias**, systematically understating forecasting error and misleading risk management.

### 2.2 Gate Closure Decision Cutoff Formulation

For any target delivery date $D$, the decision cutoff timestamp $T_{\text{cutoff}}$ is defined as:

$$T_{\text{cutoff}}(D, t_{\text{cutoff}}) = (D - 1 \text{ day}) \text{ at } t_{\text{cutoff}} \text{ UTC}$$

*Example*: For delivery date **2026-01-16** with a configured decision cutoff of **10:00 UTC**:
$$T_{\text{cutoff}} = \text{2026-01-15T10:00:00Z}$$

Any forecast published after $T_{\text{cutoff}}$ is strictly discarded from the day-ahead evaluation set.

### 2.3 The Forecast Selection Algorithm

For each target delivery interval starting at $T_{\text{target}}$ on delivery date $D$:

1. **Extract Candidate Forecasts**:
   $$\mathcal{F}(T_{\text{target}}) = \{ f \in \text{WINDFOR} \mid f.\text{startTime} = T_{\text{target}} \}$$

2. **Filter by Cutoff Eligibility**:
   $$\mathcal{F}_{\text{eligible}}(T_{\text{target}}, T_{\text{cutoff}}) = \{ f \in \mathcal{F}(T_{\text{target}}) \mid f.\text{publishTime} \le T_{\text{cutoff}} \}$$

3. **Select Latest Forecast**:
   $$f^*(T_{\text{target}}) = \operatorname*{argmax}_{f \in \mathcal{F}_{\text{eligible}}} (f.\text{publishTime})$$

4. **Deterministic Tie-Breaking**:
   If two records share the identical latest `publishTime`, the record with the higher generation value is selected deterministically:
   $$\text{Key} = (f.\text{publishTime}, f.\text{generation})$$

---

## 3. Data Sources & Schema Ingestion

REint AI ingests data exclusively from authoritative **Elexon BMRS** OpenAPI streams.

### 3.1 WINDFOR (Wind Generation Forecasts)

* **Provider**: National Grid Electricity System Operator (NGESO).
* **Endpoint**: `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
* **Query Parameters**: `publishDateTimeFrom`, `publishDateTimeTo`
* **Temporal Resolution**: **Hourly** intervals (24 intervals per day). Forecasts project up to 72 hours into the future.
* **Publication Schedule**: NGESO issues forecasts multiple times daily (typically ~02:30, 04:30, 07:30, 09:30, 12:25, 15:30, 18:30, 22:30 UTC).
* **Key Fields**:
  * `publishTime` (ISO UTC): The exact moment the forecast model output was published.
  * `startTime` (ISO UTC): The start of the 1-hour generation period being predicted.
  * `generation` (Float, MW): Predicted national average wind power generation.

### 3.2 FUELHH (Actual Generation by Fuel Type)

* **Provider**: Elexon Balancing Mechanism Reporting Service.
* **Endpoint**: `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
* **Query Parameters**: `publishDateTimeFrom`, `publishDateTimeTo`
* **Filtering**: Ingestion filters strictly to `fuelType == "WIND"`.
* **Temporal Resolution**: **Half-Hourly** intervals (48 Settlement Periods per delivery day).
* **Key Fields**:
  * `settlementDate` (YYYY-MM-DD): The GB settlement date.
  * `settlementPeriod` (Integer, 1–48): The 30-minute settlement period within the day.
  * `startTime` (ISO UTC): Beginning of the 30-minute settlement period.
  * `generation` (Float, MW): Outturn actual metered wind power injected into the transmission system.

---

## 4. Granularity Alignment & Settlement Mapping

Because `WINDFOR` forecasts are published at **hourly resolution** (24 intervals/day) and `FUELHH` actuals are metered at **half-hourly resolution** (48 intervals/day), REint AI implements two bidirectional alignment methodologies:

```
                       Hourly vs. Half-Hourly Settlement Mapping
  
  Delivery Hour h:   [---------------- 1 Hour Interval (WINDFOR) ----------------]
  Settlement:        [--- SP 2h + 1 (30 min) ---] [--- SP 2h + 2 (30 min) ---]
                     (e.g., SP 1: 00:00-00:30)    (e.g., SP 2: 00:30-01:00)
```

### 4.1 Hourly View (Default Procurement Mode)

Traders buying standard 1-hour block contracts require hourly alignment:
* **Forecast**: $F_h = f^*(T_{\text{target}, h})$ from `WINDFOR`.
* **Actual Aggregation**: Actual power generation is the arithmetic mean of the two constituent settlement periods:
  $$A_h = \frac{A_{\text{SP } 2h+1} + A_{\text{SP } 2h+2}}{2}$$
  *Rationale*: Generation in MW represents instantaneous average power over the time window. The average power over 1 hour is the time-weighted mean of the two 30-minute intervals.
* **Resulting Series**: Exactly 24 records per day ($h = 0, 1, \dots, 23$).

### 4.2 Half-Hourly View (Balancing Mechanism Mode)

Analysts evaluating imbalance exposure across individual settlement periods use half-hourly alignment:
* **Actual**: $A_{\text{SP}} = A_{\text{SP}}$ from `FUELHH` ($SP = 1, 2, \dots, 48$).
* **Forecast Mapping**: The hourly forecast covering hour $h = \lfloor (SP - 1) / 2 \rfloor$ is assigned to both constituent half-hour intervals:
  $$F_{\text{SP}} = F_h$$
* **Resulting Series**: Exactly 48 records per day ($SP = 1, 2, \dots, 48$).

---

## 5. Mathematical Metric Definitions

All statistical error metrics are evaluated strictly over **matched interval pairs** where both forecast and actual values exist.

Let:
* $f_i$ be the selected wind forecast for interval $i$ in MW.
* $y_i$ be the actual wind outturn generation for interval $i$ in MW.
* $N$ be the count of valid matched intervals.

### 5.1 Forecast Error (Signed Error)
$$e_i = f_i - y_i \quad [\text{MW}]$$

* **Sign Convention**:
  * **$e_i > 0$ (Overforecasting / Surplus)**: The model predicted more wind than actually generated. In day-ahead procurement, the utility under-procured thermal power and faces an unexpected energy deficit in real-time, forcing purchases at real-time imbalance cashout prices.
  * **$e_i < 0$ (Underforecasting / Deficit)**: The model predicted less wind than actually generated. The utility procured unnecessary thermal hedges and has surplus power in real-time.
  * **$e_i = 0$**: Perfect forecast match.

### 5.2 Absolute Error
$$|e_i| = |f_i - y_i| \quad [\text{MW}]$$

### 5.3 Mean Absolute Error (MAE)
Measures the average magnitude of forecast errors without regard to direction:
$$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} |f_i - y_i| \quad [\text{MW}]$$

*Interpretation*: Provides a straightforward expectation of the typical error volume (in MW) that the procurement desk must balance.

### 5.4 Root Mean Squared Error (RMSE)
Measures the square root of the mean squared errors, heavily penalizing large outliers:
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (f_i - y_i)^2} \quad [\text{MW}]$$

*Interpretation*: Because RMSE penalizes large errors disproportionately, a large gap between RMSE and MAE indicates the presence of sudden forecast spikes or ramps that were missed by the day-ahead model.

### 5.5 Mean Forecast Error (Bias)
Measures systematic directional overforecasting or underforecasting:
$$\text{Bias} = \frac{1}{N} \sum_{i=1}^{N} (f_i - y_i) \quad [\text{MW}]$$

*Interpretation*:
* $\text{Bias} > 0$: Systematic over-optimism in wind predictions.
* $\text{Bias} < 0$: Systematic conservatism in wind predictions.
* $\text{Bias} \approx 0$: Unbiased forecast distribution.

### 5.6 Mean Absolute Percentage Error (MAPE)
Measures error relative to actual output:
$$\text{MAPE} = \frac{1}{M} \sum_{i \in \mathcal{S}} \frac{|f_i - y_i|}{y_i} \times 100\% \quad [\%]$$
where $\mathcal{S} = \{ i \mid y_i > 0 \}$ and $M = |\mathcal{S}|$.

* **Zero-Safe Treatment**: In periods of near-total calm where actual wind generation approaches 0 MW, standard MAPE calculation suffers from division-by-zero or extreme skew. REint AI restricts MAPE calculation strictly to non-zero actual observations ($y_i > 0$). If all actuals in a selection are zero, MAPE returns `null`.

### 5.7 Coverage Percentage
$$\text{Coverage} = \left( \frac{N}{N_{\text{expected}}} \right) \times 100\% \quad [\%]$$
where $N_{\text{expected}}$ is 24 for hourly or 48 for half-hourly per delivery day.

---

## 6. Edge Case & Data Quality Handling

| Scenario | System Behavior | Rationale |
|:---|:---|:---|
| **Missing Actual Record** | Interval marked as `status: "missing_actual"`. Actual is set to `null`. Errors are not computed. | Never substitute 0 MW for unmetered or unrecorded intervals. |
| **Missing Forecast Record** | Interval marked as `status: "missing_forecast"`. Forecast is set to `null`. | If no forecast was published prior to cutoff, do not guess or interpolate. |
| **Both Missing** | Interval marked as `status: "excluded"`. | Preserves 24 or 48 interval grid continuity while excluding from metrics. |
| **Zero Actual Generation** | Preserved as `0.0 MW`. MAE, RMSE, and Bias include this interval. MAPE excludes division by zero. | Calm wind days are legitimate physical events; they must not be filtered out of volume error statistics. |
| **Duplicate Publications** | Deterministic selection based on `(publishTime, generation)`. | Eliminates non-deterministic sorting artifacts across backend restarts. |
| **Month Boundaries** | For delivery date 2026-01-01, the D-1 cutoff is evaluated against 2025-12-31 10:00 UTC. The WINDFOR fetcher queries a 3-day lookback buffer. | Ensures the very first day of the target month has complete day-ahead forecast coverage. |
