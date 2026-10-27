import math
import logging
from typing import List, Dict, Any, Optional
from app.schemas.models import IntervalRecord, AccuracyMetrics, DailySummary, AccuracyResponse

logger = logging.getLogger(__name__)

class MetricsService:
    @staticmethod
    def calculate_accuracy_metrics(
        records: List[IntervalRecord],
        total_possible_intervals: Optional[int] = None
    ) -> AccuracyMetrics:
        """
        Calculate MAE, RMSE, Bias (Mean Error), and MAPE strictly over valid matched observations.
        - Excludes missing forecast or actual records.
        - Never treats missing values as zero.
        - Preserves genuine zero generation values.
        """
        matched = [r for r in records if r.status == "matched" and r.forecast_mw is not None and r.actual_mw is not None]
        total = total_possible_intervals if total_possible_intervals is not None else len(records)
        matched_count = len(matched)
        missing_count = total - matched_count

        if matched_count == 0:
            return AccuracyMetrics(
                total_intervals=total,
                matched_intervals=0,
                missing_intervals=total,
                mae_mw=None,
                rmse_mw=None,
                bias_mw=None,
                mape_percent=None,
                coverage_percentage=0.0
            )

        errors = [r.forecast_mw - r.actual_mw for r in matched]
        abs_errors = [abs(e) for e in errors]
        squared_errors = [e ** 2 for e in errors]

        mae = sum(abs_errors) / matched_count
        rmse = math.sqrt(sum(squared_errors) / matched_count)
        bias = sum(errors) / matched_count

        # MAPE calculation: strictly over observations where actual_mw > 0
        non_zero_actuals = [r for r in matched if r.actual_mw > 0]
        if non_zero_actuals:
            mape = sum((abs(r.forecast_mw - r.actual_mw) / r.actual_mw) * 100.0 for r in non_zero_actuals) / len(non_zero_actuals)
            mape_rounded = round(mape, 2)
        else:
            mape_rounded = None

        coverage = round((matched_count / total) * 100.0, 2) if total > 0 else 0.0

        return AccuracyMetrics(
            total_intervals=total,
            matched_intervals=matched_count,
            missing_intervals=missing_count,
            mae_mw=round(mae, 2),
            rmse_mw=round(rmse, 2),
            bias_mw=round(bias, 2),
            mape_percent=mape_rounded,
            coverage_percentage=coverage
        )

    @staticmethod
    def calculate_daily_summary(records: List[IntervalRecord]) -> List[DailySummary]:
        """Group interval records by date and compute per-day accuracy summaries."""
        grouped: Dict[str, List[IntervalRecord]] = {}
        for r in records:
            d = r.settlement_date
            if d not in grouped:
                grouped[d] = []
            grouped[d].append(r)

        summaries: List[DailySummary] = []
        for date_key in sorted(grouped.keys()):
            day_records = grouped[date_key]
            metrics = MetricsService.calculate_accuracy_metrics(day_records)
            
            valid_f = [r.forecast_mw for r in day_records if r.forecast_mw is not None]
            valid_a = [r.actual_mw for r in day_records if r.actual_mw is not None]

            summaries.append(DailySummary(
                date=date_key,
                total_intervals=len(day_records),
                matched_intervals=metrics.matched_intervals,
                avg_forecast_mw=round(sum(valid_f) / len(valid_f), 2) if valid_f else None,
                avg_actual_mw=round(sum(valid_a) / len(valid_a), 2) if valid_a else None,
                mae_mw=metrics.mae_mw,
                rmse_mw=metrics.rmse_mw,
                bias_mw=metrics.bias_mw
            ))

        return summaries

metrics_service = MetricsService()
