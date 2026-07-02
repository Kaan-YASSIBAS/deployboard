from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import incidents, monitors

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for DeployBoard uptime monitoring platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(monitors.router)
app.include_router(incidents.router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "deployboard-api",
        "version": settings.app_version,
        "environment": settings.environment,
    }


@app.get("/")
def root():
    return {
        "message": "DeployBoard API is running",
        "docs": "/docs",
        "health": "/health",
    }