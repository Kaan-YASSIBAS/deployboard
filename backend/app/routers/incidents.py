from typing import List

from fastapi import APIRouter

from app.models.incident import Incident
from app.services.incident_service import list_active_incidents, list_incidents


router = APIRouter(prefix="/api/v1/incidents", tags=["incidents"])


@router.get("", response_model=List[Incident])
def get_incidents():
    return list_incidents()


@router.get("/active", response_model=List[Incident])
def get_active_incidents():
    return list_active_incidents()