from fastapi import APIRouter, HTTPException, status

from app.models.monitor import Monitor, MonitorCreate, MonitorUpdate
from app.services.monitor_service import monitor_service

from app.models.check import CheckResult
from app.services.check_service import check_service, check_status_to_monitor_status

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
    

@router.post("/{monitor_id}/check", response_model=CheckResult)
def run_monitor_check(monitor_id: str):
    monitor = monitor_service.get_monitor(monitor_id)

    if monitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

    result = check_service.run_check(monitor)

    monitor_status = check_status_to_monitor_status(result.status)
    monitor_service.update_monitor_status(monitor_id, monitor_status)

    return result


@router.get("/{monitor_id}/checks", response_model=list[CheckResult])
def list_monitor_checks(monitor_id: str):
    monitor = monitor_service.get_monitor(monitor_id)

    if monitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

    return check_service.list_checks_for_monitor(monitor_id)