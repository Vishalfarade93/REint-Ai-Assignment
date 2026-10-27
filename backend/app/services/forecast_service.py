import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta, timezone
from app.schemas.models import IntervalRecord, SummaryStatistics, ForecastResponse

logger = logging.getLogger(__name__)

class ForecastService:
    @staticmethod
    def calculate_cutoff_timestamp(delivery_date: str, cutoff_time: str = "10:00") -> str:
        """
        Calculate the day-ahead decision cutoff timestamp in ISO UTC format.
        For delivery date D, the day-ahead cutoff is on D-1 at cutoff_time UTC.
        Example: delivery_date='2026-01-16', cutoff_time='10:00' -> '2026-01-15T10:00:00Z'
        """
        try:
            d_date = datetime.fromisoformat(delivery_date).date()
            d_minus_1 = d_date - timedelta(days=1)
            parts = cutoff_time.split(":")
            hour = int(parts[0])
            minute = int(parts[1]) if len(parts) > 1 else 0
            cutoff_dt = datetime(d_minus_1.year, d_minus_1.month, d_minus_1.day, hour, minute, 0, tzinfo=timezone.utc)
            return cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except Exception as e:
            logger.error(f"Error computing cutoff timestamp: {e}")
            raise ValueError(f"Invalid delivery_date or cutoff_time format: {delivery_date}, {cutoff_time}")

    @staticmethod
    def normalize_iso_utc(ts: str) -> str:
        """Ensure timestamp ends with 'Z' and has standardized formatting."""
        if not ts:
            return ts
        if ts.endswith("+00:00"):
            return ts.replace("+00:00", "Z")
        if not ts.endswith("Z"):
            return ts + "Z"
        return ts

    @staticmethod
    def select_latest_eligible_forecasts(
        forecast_records: List[Dict[str, Any]],
        cutoff_utc: str
    ) -> Dict[str, Dict[str, Any]]:
        """
        Historical Forecast Selection Algorithm:
        For each target interval startTime:
        1. Exclude any forecast published after the decision cutoff (publishTime > cutoff_utc).
        2. From the remaining eligible forecasts, select the one with the latest publishTime.
        3. If multiple forecasts share the latest publishTime, resolve deterministically.
        Returns a dict mapping target startTime -> selected forecast dict.
        """
        cutoff_norm = ForecastService.normalize_iso_utc(cutoff_utc)
        eligible_by_target: Dict[str, List[Dict[str, Any]]] = {}

        for rec in forecast_records:
            pub_time = ForecastService.normalize_iso_utc(rec.get("publishTime", ""))
            start_time = ForecastService.normalize_iso_utc(rec.get("startTime", ""))

            # Strictly exclude forecasts published after the cutoff
            if pub_time <= cutoff_norm:
                if start_time not in eligible_by_target:
                    eligible_by_target[start_time] = []
                eligible_by_target[start_time].append(rec)

        selected: Dict[str, Dict[str, Any]] = {}
        for start_time, candidates in eligible_by_target.items():
            # Sort by publishTime descending.
            # In case of tie, sort deterministically by generation value and dataset
            candidates.sort(
                key=lambda x: (
                    ForecastService.normalize_iso_utc(x.get("publishTime", "")),
                    float(x.get("generation", 0.0))
                ),
                reverse=True
            )
            selected[start_time] = candidates[0]

        return selected

    @staticmethod
    def process_delivery_date(
        delivery_date: str,
        cutoff_time: str,
        granularity: str,
        raw_forecasts: List[Dict[str, Any]],
        raw_actuals: List[Dict[str, Any]]
    ) -> ForecastResponse:
        """
        Produce complete, matched analytical interval records for the target delivery date.
        """
        cutoff_utc = ForecastService.calculate_cutoff_timestamp(delivery_date, cutoff_time)
        selected_forecasts = ForecastService.select_latest_eligible_forecasts(raw_forecasts, cutoff_utc)

        # Map actuals by settlementDate and settlementPeriod / startTime
        actuals_by_sp: Dict[int, Dict[str, Any]] = {}
        actuals_by_start: Dict[str, Dict[str, Any]] = {}

        for act in raw_actuals:
            if act.get("settlementDate") == delivery_date:
                sp = act.get("settlementPeriod")
                st = ForecastService.normalize_iso_utc(act.get("startTime", ""))
                if sp is not None:
                    actuals_by_sp[int(sp)] = act
                if st:
                    actuals_by_start[st] = act

        interval_records: List[IntervalRecord] = []
        d_date = datetime.fromisoformat(delivery_date).date()

        if granularity.lower() == "half_hourly":
            # 48 Settlement Periods (SP 1 to 48)
            for sp in range(1, 49):
                # Calculate interval start & end times
                minute_offset = (sp - 1) * 30
                interval_start_dt = datetime(d_date.year, d_date.month, d_date.day, 0, 0, 0, tzinfo=timezone.utc) + timedelta(minutes=minute_offset)
                interval_end_dt = interval_start_dt + timedelta(minutes=30)
                start_iso = interval_start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                end_iso = interval_end_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

                # The corresponding hourly forecast begins on the hour
                hour_start_dt = datetime(interval_start_dt.year, interval_start_dt.month, interval_start_dt.day, interval_start_dt.hour, 0, 0, tzinfo=timezone.utc)
                hour_start_iso = hour_start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

                # Forecast lookup
                f_rec = selected_forecasts.get(hour_start_iso)
                forecast_mw = float(f_rec["generation"]) if f_rec and f_rec.get("generation") is not None else None
                f_pub = f_rec.get("publishTime") if f_rec else None

                # Actual lookup by settlement period (preferred) or start timestamp
                a_rec = actuals_by_sp.get(sp) or actuals_by_start.get(start_iso)
                actual_mw = float(a_rec["generation"]) if a_rec and a_rec.get("generation") is not None else None

                # Calculate errors
                f_err = None
                abs_err = None
                pct_err = None
                status = "matched"

                if forecast_mw is not None and actual_mw is not None:
                    f_err = round(forecast_mw - actual_mw, 2)
                    abs_err = round(abs(forecast_mw - actual_mw), 2)
                    pct_err = round((abs_err / actual_mw) * 100.0, 2) if actual_mw > 0 else None
                    status = "matched"
                elif forecast_mw is None and actual_mw is not None:
                    status = "missing_forecast"
                elif forecast_mw is not None and actual_mw is None:
                    status = "missing_actual"
                else:
                    status = "excluded"

                interval_records.append(IntervalRecord(
                    interval_index=sp,
                    settlement_date=delivery_date,
                    start_time=start_iso,
                    end_time=end_iso,
                    settlement_period=sp,
                    granularity="half_hourly",
                    forecast_mw=round(forecast_mw, 2) if forecast_mw is not None else None,
                    forecast_publish_time=f_pub,
                    actual_mw=round(actual_mw, 2) if actual_mw is not None else None,
                    forecast_error_mw=f_err,
                    absolute_error_mw=abs_err,
                    percentage_error=pct_err,
                    status=status,
                    notes=f"Mapped from hourly forecast {hour_start_iso[11:16]} UTC" if f_rec else "No eligible forecast before cutoff"
                ))
        else:
            # Hourly granularity (24 intervals)
            for h in range(24):
                interval_start_dt = datetime(d_date.year, d_date.month, d_date.day, h, 0, 0, tzinfo=timezone.utc)
                interval_end_dt = interval_start_dt + timedelta(hours=1)
                start_iso = interval_start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                end_iso = interval_end_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

                # Forecast lookup
                f_rec = selected_forecasts.get(start_iso)
                forecast_mw = float(f_rec["generation"]) if f_rec and f_rec.get("generation") is not None else None
                f_pub = f_rec.get("publishTime") if f_rec else None

                # Hourly actual generation is the average of the two settlement periods:
                sp1 = h * 2 + 1
                sp2 = h * 2 + 2
                sp1_rec = actuals_by_sp.get(sp1)
                sp2_rec = actuals_by_sp.get(sp2)

                actual_mw = None
                if sp1_rec and sp2_rec:
                    actual_mw = (float(sp1_rec["generation"]) + float(sp2_rec["generation"])) / 2.0
                elif sp1_rec:
                    actual_mw = float(sp1_rec["generation"])
                elif sp2_rec:
                    actual_mw = float(sp2_rec["generation"])

                # Calculate errors
                f_err = None
                abs_err = None
                pct_err = None
                status = "matched"

                if forecast_mw is not None and actual_mw is not None:
                    f_err = round(forecast_mw - actual_mw, 2)
                    abs_err = round(abs(forecast_mw - actual_mw), 2)
                    pct_err = round((abs_err / actual_mw) * 100.0, 2) if actual_mw > 0 else None
                    status = "matched"
                elif forecast_mw is None and actual_mw is not None:
                    status = "missing_forecast"
                elif forecast_mw is not None and actual_mw is None:
                    status = "missing_actual"
                else:
                    status = "excluded"

                interval_records.append(IntervalRecord(
                    interval_index=h + 1,
                    settlement_date=delivery_date,
                    start_time=start_iso,
                    end_time=end_iso,
                    settlement_period=None,
                    granularity="hourly",
                    forecast_mw=round(forecast_mw, 2) if forecast_mw is not None else None,
                    forecast_publish_time=f_pub,
                    actual_mw=round(actual_mw, 2) if actual_mw is not None else None,
                    forecast_error_mw=f_err,
                    absolute_error_mw=abs_err,
                    percentage_error=pct_err,
                    status=status,
                    notes=f"Aggregated actuals from SP {sp1} & {sp2}" if (sp1_rec and sp2_rec) else "Single/missing SP actual"
                ))

        # Compute summary statistics
        valid_f = [r.forecast_mw for r in interval_records if r.forecast_mw is not None]
        valid_a = [r.actual_mw for r in interval_records if r.actual_mw is not None]
        matched_count = sum(1 for r in interval_records if r.status == "matched")

        summary = SummaryStatistics(
            avg_forecast_mw=round(sum(valid_f) / len(valid_f), 2) if valid_f else None,
            min_forecast_mw=round(min(valid_f), 2) if valid_f else None,
            max_forecast_mw=round(max(valid_f), 2) if valid_f else None,
            avg_actual_mw=round(sum(valid_a) / len(valid_a), 2) if valid_a else None,
            min_actual_mw=round(min(valid_a), 2) if valid_a else None,
            max_actual_mw=round(max(valid_a), 2) if valid_a else None,
            valid_forecast_intervals=len(valid_f),
            valid_actual_intervals=len(valid_a),
            missing_forecast_intervals=len(interval_records) - len(valid_f),
            missing_actual_intervals=len(interval_records) - len(valid_a),
            matched_intervals=matched_count
        )

        return ForecastResponse(
            delivery_date=delivery_date,
            decision_cutoff_utc=cutoff_utc,
            granularity=granularity,
            summary=summary,
            records=interval_records
        )

forecast_service = ForecastService()
