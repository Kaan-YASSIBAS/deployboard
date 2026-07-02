import asyncio
from datetime import datetime, timezone

from app.services.check_service import check_service, check_status_to_monitor_status
from app.services.monitor_service import monitor_service


class SchedulerService:
    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._last_checked_at: dict[str, datetime] = {}

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run())

    def stop(self) -> None:
        if self._task and not self._task.done():
            self._task.cancel()

    async def _run(self) -> None:
        while True:
            await self._check_due_monitors()
            await asyncio.sleep(5)

    async def _check_due_monitors(self) -> None:
        now = datetime.now(timezone.utc)
        monitors = monitor_service.list_monitors()

        for monitor in monitors:
            last_checked_at = self._last_checked_at.get(monitor.id)

            if last_checked_at is not None:
                elapsed_seconds = (now - last_checked_at).total_seconds()

                if elapsed_seconds < monitor.check_interval_seconds:
                    continue

            try:
                result = await asyncio.to_thread(check_service.run_check, monitor)
                monitor_status = check_status_to_monitor_status(result.status)
                monitor_service.update_monitor_status(monitor.id, monitor_status)
                self._last_checked_at[monitor.id] = now
            except Exception as exc:
                print(f"Scheduler failed to check monitor {monitor.id}: {exc}")


scheduler_service = SchedulerService()