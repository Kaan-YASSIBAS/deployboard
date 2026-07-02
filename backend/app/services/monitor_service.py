from datetime import datetime, timezone

from app.config import settings
from app.models.monitor import Monitor, MonitorCreate, MonitorUpdate
from app.repositories.monitor_repository import MonitorRepository
from app.services.incident_service import resolve_incident


class MonitorService:
    def __init__(self) -> None:
        self._monitors: dict[str, Monitor] = {}
        self._repository = (
            MonitorRepository()
            if settings.storage_backend == "dynamodb"
            else None
        )

    def list_monitors(self) -> list[Monitor]:
        if self._repository:
            return self._repository.list_monitors()

        return list(self._monitors.values())

    def get_monitor(self, monitor_id: str) -> Monitor | None:
        if self._repository:
            return self._repository.get_monitor(monitor_id)

        return self._monitors.get(monitor_id)

    def create_monitor(self, payload: MonitorCreate) -> Monitor:
        monitor = Monitor(
            name=payload.name,
            url=payload.url,
            expected_status=payload.expected_status,
            check_interval_seconds=payload.check_interval_seconds,
        )

        if self._repository:
            return self._repository.save_monitor(monitor)

        self._monitors[monitor.id] = monitor
        return monitor

    def update_monitor(self, monitor_id: str, payload: MonitorUpdate) -> Monitor | None:
        monitor = self.get_monitor(monitor_id)

        if monitor is None:
            return None

        update_data = payload.model_dump(exclude_unset=True)

        updated_monitor = monitor.model_copy(
            update={
                **update_data,
                "updated_at": datetime.now(timezone.utc),
            }
        )

        if self._repository:
            return self._repository.save_monitor(updated_monitor)

        self._monitors[monitor_id] = updated_monitor
        return updated_monitor

    def update_monitor_status(self, monitor_id: str, status) -> Monitor | None:
        monitor = self.get_monitor(monitor_id)

        if monitor is None:
            return None

        updated_monitor = monitor.model_copy(
            update={
                "status": status,
                "updated_at": datetime.now(timezone.utc),
            }
        )

        if self._repository:
            return self._repository.save_monitor(updated_monitor)

        self._monitors[monitor_id] = updated_monitor
        return updated_monitor

    def delete_monitor(self, monitor_id: str) -> bool:
        if self._repository:
            deleted = self._repository.delete_monitor(monitor_id)
        else:
            if monitor_id not in self._monitors:
                return False

            del self._monitors[monitor_id]
            deleted = True

        if not deleted:
            return False

        resolve_incident(monitor_id)
        return True


monitor_service = MonitorService()
