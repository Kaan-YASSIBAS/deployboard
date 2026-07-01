from fastapi import APIRouter, HTTPException, status

from app.models.monitor import Monitor, MonitorCreate, MonitorUpdate
from app.services.monitor_service import monitor_service

router = APIRouter(prefix="/api/v1/monitors", tags=["monitors"])


@router.get("", response_model=list[Monitor])
def list_monitors():
    return monitor_service.list_monitors()


@router.post("", response_model=Monitor, status_code=status.HTTP_201_CREATED)
def create_monitor(payload: MonitorCreate):
    return monitor_service.create_monitor(payload)


@router.get("/{monitor_id}", response_model=Monitor)
def get_monitor(monitor_id: str):
    monitor = monitor_service.get_monitor(monitor_id)

    if monitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

    return monitor


@router.patch("/{monitor_id}", response_model=Monitor)
def update_monitor(monitor_id: str, payload: MonitorUpdate):
    monitor = monitor_service.update_monitor(monitor_id, payload)

    if monitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

    return monitor


@router.delete("/{monitor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitor(monitor_id: str):
    deleted = monitor_service.delete_monitor(monitor_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )