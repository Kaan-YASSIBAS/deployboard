from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import incidents, monitors
from app.services.scheduler_service import scheduler_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler_service.start()
    yield
    scheduler_service.stop()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for DeployBoard uptime monitoring platform.",
    lifespan=lifespan,
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