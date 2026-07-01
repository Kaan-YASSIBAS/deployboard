from datetime import datetime, timezone

from app.models.monitor import Monitor, MonitorCreate, MonitorUpdate


class MonitorService:
    def __init__(self) -> None:
        self._monitors: dict[str, Monitor] = {}

    def list_monitors(self) -> list[Monitor]:
        return list(self._monitors.values())

    def get_monitor(self, monitor_id: str) -> Monitor | None:
        return self._monitors.get(monitor_id)

    def create_monitor(self, payload: MonitorCreate) -> Monitor:
        monitor = Monitor(
            name=payload.name,
            url=payload.url,
            expected_status=payload.expected_status,
            check_interval_seconds=payload.check_interval_seconds,
        )
        self._monitors[monitor.id] = monitor
        return monitor

    def update_monitor(self, monitor_id: str, payload: MonitorUpdate) -> Monitor | None:
        monitor = self._monitors.get(monitor_id)

        if monitor is None:
            return None

        update_data = payload.model_dump(exclude_unset=True)

        updated_monitor = monitor.model_copy(
            update={
                **update_data,
                "updated_at": datetime.now(timezone.utc),
            }
        )

        self._monitors[monitor_id] = updated_monitor
        return updated_monitor
    
    def update_monitor_status(self, monitor_id: str, status) -> Monitor | None:
        monitor = self._monitors.get(monitor_id)

        if monitor is None:
            return None

        updated_monitor = monitor.model_copy(
            update={
                "status": status,
                "updated_at": datetime.now(timezone.utc),
            }
        )

        self._monitors[monitor_id] = updated_monitor
        return updated_monitor

    def delete_monitor(self, monitor_id: str) -> bool:
        if monitor_id not in self._monitors:
            return False

        del self._monitors[monitor_id]
        return True


monitor_service = MonitorService()