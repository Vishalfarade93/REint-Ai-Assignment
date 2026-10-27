from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class IntervalRecord(BaseModel):
    interval_index: int = Field(..., description="Chronological interval index (1-24 for hourly, 1-48 for half-hourly)")
    settlement_date: str = Field(..., description="Target delivery date (YYYY-MM-DD)")
    start_time: str = Field(..., description="Target interval start time in UTC ISO format")
    end_time: str = Field(..., description="Target interval end time in UTC ISO format")
    settlement_period: Optional[int] = Field(None, description="Elexon settlement period (1-48) if half-hourly")
    granularity: str = Field(..., description="'hourly' or 'half_hourly'")
    
    # Forecast fields
    forecast_mw: Optional[float] = Field(None, description="Forecast wind generation in MW available at cutoff")
    forecast_publish_time: Optional[str] = Field(None, description="Publication timestamp of the selected forecast")
    
    # Actual fields
    actual_mw: Optional[float] = Field(None, description="Actual wind generation in MW from FUELHH")
    
    # Analytical error fields
    forecast_error_mw: Optional[float] = Field(None, description="Forecast Error: (forecast - actual) in MW")
    absolute_error_mw: Optional[float] = Field(None, description="Absolute Error: |forecast - actual| in MW")
    percentage_error: Optional[float] = Field(None, description="Percentage error relative to actual (|err| / actual * 100)")
    
    # Quality & transparency
    status: str = Field(..., description="'matched', 'missing_actual', 'missing_forecast', or 'excluded'")
    notes: Optional[str] = Field(None, description="Data quality or matching notes")

class SummaryStatistics(BaseModel):
    avg_forecast_mw: Optional[float] = None
    min_forecast_mw: Optional[float] = None
    max_forecast_mw: Optional[float] = None
    avg_actual_mw: Optional[float] = None
    min_actual_mw: Optional[float] = None
    max_actual_mw: Optional[float] = None
    valid_forecast_intervals: int = 0
    valid_actual_intervals: int = 0
    missing_forecast_intervals: int = 0
    missing_actual_intervals: int = 0
    matched_intervals: int = 0

class AccuracyMetrics(BaseModel):
    total_intervals: int
    matched_intervals: int
    missing_intervals: int
    mae_mw: Optional[float] = Field(None, description="Mean Absolute Error in MW")
    rmse_mw: Optional[float] = Field(None, description="Root Mean Squared Error in MW")
    bias_mw: Optional[float] = Field(None, description="Mean Error (Bias) in MW. Positive = Overforecasting, Negative = Underforecasting")
    mape_percent: Optional[float] = Field(None, description="Mean Absolute Percentage Error (%) - reported only where actual > 0")
    coverage_percentage: float = Field(..., description="Percentage of intervals with matched forecast and actual")

class DailySummary(BaseModel):
    date: str
    total_intervals: int
    matched_intervals: int
    avg_forecast_mw: Optional[float] = None
    avg_actual_mw: Optional[float] = None
    mae_mw: Optional[float] = None
    rmse_mw: Optional[float] = None
    bias_mw: Optional[float] = None

class ForecastResponse(BaseModel):
    delivery_date: str
    decision_cutoff_utc: str
    granularity: str
    summary: SummaryStatistics
    records: List[IntervalRecord]

class AccuracyResponse(BaseModel):
    start_date: str
    end_date: str
    decision_cutoff_time: str
    granularity: str
    metrics: AccuracyMetrics
    daily_summaries: List[DailySummary]

class MetadataResponse(BaseModel):
    project_name: str
    version: str
    data_sources: List[Dict[str, str]]
    supported_period: Dict[str, str]
    decision_cutoff_info: Dict[str, Any]
    timezone_convention: str
    generation_units: str
    cache_info: Dict[str, Any]
