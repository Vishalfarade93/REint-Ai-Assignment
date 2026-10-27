import os
from typing import List

class Settings:
    PROJECT_NAME: str = "REint AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Elexon BMRS API endpoints
    ELEXON_BASE_URL: str = os.getenv("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")
    
    # Default Day-Ahead decision cutoff (UTC time on D-1, e.g. "10:00")
    DEFAULT_CUTOFF_TIME: str = os.getenv("DEFAULT_CUTOFF_TIME", "10:00")
    
    # Cache directory for retrieved raw datasets
    CACHE_DIR: str = os.getenv("CACHE_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data_cache"))
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost",
        "*"
    ]

settings = Settings()
os.makedirs(settings.CACHE_DIR, exist_ok=True)
