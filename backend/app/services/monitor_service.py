from datetime import datetime, timezone

from app.config import settings
from app.models.monitor import Monitor, MonitorCreate, MonitorUpdate
from app.repositories.monitor_repository import MonitorRepository
from app.services.incident_service import resolve_incident


class MonitorLimitExceededError(Exception):
    def __init__(self, limit: int) -> None:
        self.limit = limit
        super().__init__(f"Monitor limit of {limit} reached")


class MonitorService:
    def __init__(self) -> None:
        self._monitors: dict[str, Monitor] = {}
        self._repository = (
            MonitorRepository()
            if settings.storage_backend == "dynamodb"
            else None
        )

    def list_monitors(self, user_id: str) -> list[Monitor]:
        if self._repository:
            return self._repository.list_monitors(user_id)

        return [
            monitor
            for monitor in self._monitors.values()
            if monitor.user_id == user_id
        ]

    def list_all_monitors(self) -> list[Monitor]:
        if self._repository:
            monitors = self._repository.list_all_monitors()
        else:
            monitors = list(self._monitors.values())

        return [monitor for monitor in monitors if monitor.user_id is not None]

    def get_monitor(self, user_id: str, monitor_id: str) -> Monitor | None:
        if self._repository:
            return self._repository.get_monitor(user_id, monitor_id)

        monitor = self._monitors.get(monitor_id)

        if monitor is None or monitor.user_id != user_id:
            return None

        return monitor

    def create_monitor(self, user_id: str, payload: MonitorCreate) -> Monitor:
        if len(self.list_monitors(user_id)) >= settings.max_monitors_per_user:
            raise MonitorLimitExceededError(settings.max_monitors_per_user)

        monitor = Monitor(
            user_id=user_id,
            name=payload.name,
            url=payload.url,
            expected_status=payload.expected_status,
            check_interval_seconds=payload.check_interval_seconds,
        )

        if self._repository:
            return self._repository.save_monitor(monitor)

        self._monitors[monitor.id] = monitor
        return monitor

    def update_monitor(
        self,
        user_id: str,
        monitor_id: str,
        payload: MonitorUpdate,
    ) -> Monitor | None:
        monitor = self.get_monitor(user_id, monitor_id)

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

    def update_monitor_status(
        self,
        user_id: str,
        monitor_id: str,
        status,
    ) -> Monitor | None:
        monitor = self.get_monitor(user_id, monitor_id)

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

    def delete_monitor(self, user_id: str, monitor_id: str) -> bool:
        if self._repository:
            deleted = self._repository.delete_monitor(user_id, monitor_id)
        else:
            monitor = self._monitors.get(monitor_id)

            if monitor is None or monitor.user_id != user_id:
                return False

            del self._monitors[monitor_id]
            deleted = True

        if not deleted:
            return False

        resolve_incident(user_id, monitor_id)
        return True


monitor_service = MonitorService()
