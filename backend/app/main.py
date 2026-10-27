import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("reint_ai")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Renewable Energy Intelligence & Wind Forecast Analytics Platform for UK Electricity Utilities",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for local frontend development and containers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Support both /api/v1 prefix and direct root routes (e.g. /api/forecast and /forecast)
app.include_router(router, prefix=settings.API_V1_STR)
app.include_router(router)

@app.get("/", summary="Root API index")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
