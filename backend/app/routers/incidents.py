from typing import Annotated, List

from fastapi import APIRouter, Depends

from app.models.incident import Incident
from app.models.user import User
from app.security import get_current_user
from app.services.incident_service import list_active_incidents, list_incidents


router = APIRouter(prefix="/api/v1/incidents", tags=["incidents"])


@router.get("", response_model=List[Incident])
def get_incidents(current_user: Annotated[User, Depends(get_current_user)]):
    return list_incidents(current_user.id)


@router.get("/active", response_model=List[Incident])
def get_active_incidents(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return list_active_incidents(current_user.id)
