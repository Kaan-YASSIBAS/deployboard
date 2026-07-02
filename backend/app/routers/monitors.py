from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.check import CheckResult
from app.models.monitor import Monitor, MonitorCreate, MonitorUpdate
from app.models.user import User
from app.security import get_current_user
from app.services.check_service import check_service, check_status_to_monitor_status
from app.services.monitor_service import MonitorLimitExceededError, monitor_service

router = APIRouter(prefix="/api/v1/monitors", tags=["monitors"])


@router.get("", response_model=list[Monitor])
def list_monitors(current_user: Annotated[User, Depends(get_current_user)]):
    return monitor_service.list_monitors(current_user.id)


@router.post("", response_model=Monitor, status_code=status.HTTP_201_CREATED)
def create_monitor(
    payload: MonitorCreate,
    current_user: Annotated[User, Depends(get_current_user)],
):
    try:
        return monitor_service.create_monitor(current_user.id, payload)
    except MonitorLimitExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get("/{monitor_id}", response_model=Monitor)
def get_monitor(
    monitor_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
):
    monitor = monitor_service.get_monitor(current_user.id, monitor_id)

    if monitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

    return monitor


@router.patch("/{monitor_id}", response_model=Monitor)
def update_monitor(
    monitor_id: str,
    payload: MonitorUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
):
    monitor = monitor_service.update_monitor(current_user.id, monitor_id, payload)

    if monitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

    return monitor


@router.delete("/{monitor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitor(
    monitor_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
):
    deleted = monitor_service.delete_monitor(current_user.id, monitor_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

@router.post("/{monitor_id}/check", response_model=CheckResult)
def run_monitor_check(
    monitor_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
):
    monitor = monitor_service.get_monitor(current_user.id, monitor_id)

    if monitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

    result = check_service.run_check(monitor)

    monitor_status = check_status_to_monitor_status(result.status)
    monitor_service.update_monitor_status(
        current_user.id,
        monitor_id,
        monitor_status,
    )

    return result


@router.get("/{monitor_id}/checks", response_model=list[CheckResult])
def list_monitor_checks(
    monitor_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
):
    monitor = monitor_service.get_monitor(current_user.id, monitor_id)

    if monitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

    return check_service.list_checks_for_monitor(current_user.id, monitor_id)
