import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class ElexonClient:
    def __init__(self, base_url: Optional[str] = None, cache_dir: Optional[str] = None):
        self.base_url = base_url or settings.ELEXON_BASE_URL
        self.cache_dir = cache_dir or settings.CACHE_DIR
        os.makedirs(self.cache_dir, exist_ok=True)

    def _get_cache_path(self, dataset: str, start_key: str, end_key: str) -> str:
        clean_start = start_key.replace(":", "-")
        clean_end = end_key.replace(":", "-")
        return os.path.join(self.cache_dir, f"{dataset}_{clean_start}_{clean_end}.json")

    async def fetch_fuelhh_actuals(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Fetch actual generation from FUELHH dataset for the given date range (inclusive).
        Only WIND fuelType records are retained.
        """
        # We need actuals published from start_date 00:00:00Z to end_date + 1 day 02:00:00Z to capture all settlement periods
        publish_from = f"{start_date}T00:00:00Z"
        # Parse end date and add 1 day buffer to ensure all 48 settlement periods are captured
        dt_end = datetime.fromisoformat(end_date).date() + timedelta(days=1)
        publish_to = f"{dt_end.isoformat()}T04:00:00Z"
        
        cache_file = self._get_cache_path("FUELHH_WIND", start_date, end_date)
        if os.path.exists(cache_file):
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                    logger.info(f"Loaded {len(cached_data)} FUELHH WIND records from cache: {cache_file}")
                    return cached_data
            except Exception as e:
                logger.warning(f"Error reading FUELHH cache: {e}. Refetching from API.")

        url = f"{self.base_url}/datasets/FUELHH/stream"
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to
        }
        
        logger.info(f"Requesting FUELHH from {publish_from} to {publish_to}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            raw_records = resp.json()

        # Filter strictly to WIND
        wind_records = []
        for r in raw_records:
            if r.get("fuelType") == "WIND":
                # Normalize record
                record = {
                    "dataset": "FUELHH",
                    "fuelType": "WIND",
                    "settlementDate": r.get("settlementDate"),
                    "settlementPeriod": r.get("settlementPeriod"),
                    "startTime": r.get("startTime"),
                    "publishTime": r.get("publishTime"),
                    "generation": float(r.get("generation", 0.0))
                }
                wind_records.append(record)

        # Save to cache
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(wind_records, f)
        except Exception as e:
            logger.warning(f"Failed to cache FUELHH records: {e}")

        return wind_records

    async def fetch_windfor_forecasts(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Fetch wind generation forecasts from WINDFOR dataset.
        To capture day-ahead forecasts for start_date, we fetch publications starting 3 days before start_date.
        """
        dt_start = datetime.fromisoformat(start_date).date() - timedelta(days=3)
        dt_end = datetime.fromisoformat(end_date).date() + timedelta(days=1)
        publish_from = f"{dt_start.isoformat()}T00:00:00Z"
        publish_to = f"{dt_end.isoformat()}T00:00:00Z"
        
        cache_file = self._get_cache_path("WINDFOR", publish_from[:10], publish_to[:10])
        if os.path.exists(cache_file):
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                    logger.info(f"Loaded {len(cached_data)} WINDFOR records from cache: {cache_file}")
                    return cached_data
            except Exception as e:
                logger.warning(f"Error reading WINDFOR cache: {e}. Refetching from API.")

        url = f"{self.base_url}/datasets/WINDFOR/stream"
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to
        }
        
        logger.info(f"Requesting WINDFOR from {publish_from} to {publish_to}")
        async with httpx.AsyncClient(timeout=40.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            raw_records = resp.json()

        normalized_records = []
        for r in raw_records:
            normalized_records.append({
                "dataset": "WINDFOR",
                "publishTime": r.get("publishTime"),
                "startTime": r.get("startTime"),
                "generation": float(r.get("generation", 0.0))
            })

        # Save to cache
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(normalized_records, f)
        except Exception as e:
            logger.warning(f"Failed to cache WINDFOR records: {e}")

        return normalized_records

elexon_client = ElexonClient()
