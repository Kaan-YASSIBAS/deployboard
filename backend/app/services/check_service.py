import time

import httpx

from app.config import settings
from app.models.check import CheckResult, CheckStatus
from app.models.monitor import Monitor, MonitorStatus
from app.repositories.check_repository import CheckRepository
from app.services.incident_service import open_incident, resolve_incident


class CheckService:
    def __init__(self) -> None:
        self._checks: dict[str, list[CheckResult]] = {}
        self._repository = (
            CheckRepository()
            if settings.storage_backend == "dynamodb"
            else None
        )

    def list_checks_for_monitor(self, monitor_id: str) -> list[CheckResult]:
        if self._repository:
            return self._repository.list_checks_for_monitor(monitor_id)

        return self._checks.get(monitor_id, [])

    def run_check(self, monitor: Monitor) -> CheckResult:
        start_time = time.perf_counter()

        try:
            response = httpx.get(
                str(monitor.url),
                timeout=10.0,
                follow_redirects=True,
            )

            response_time_ms = int((time.perf_counter() - start_time) * 1000)

            if response.status_code == monitor.expected_status:
                status = CheckStatus.UP
            else:
                status = CheckStatus.DOWN

            result = CheckResult(
                monitor_id=monitor.id,
                status=status,
                response_time_ms=response_time_ms,
                status_code=response.status_code,
                error=None,
            )

        except httpx.TimeoutException:
            response_time_ms = int((time.perf_counter() - start_time) * 1000)

            result = CheckResult(
                monitor_id=monitor.id,
                status=CheckStatus.DOWN,
                response_time_ms=response_time_ms,
                status_code=None,
                error="Request timed out",
            )

        except httpx.RequestError as exc:
            response_time_ms = int((time.perf_counter() - start_time) * 1000)

            result = CheckResult(
                monitor_id=monitor.id,
                status=CheckStatus.DOWN,
                response_time_ms=response_time_ms,
                status_code=None,
                error=str(exc),
            )

        self._save_check(result)
        self._sync_incident_state(monitor, result)

        return result

    def _save_check(self, result: CheckResult) -> None:
        if self._repository:
            self._repository.save_check(result)
            return

        self._checks.setdefault(result.monitor_id, []).insert(0, result)
        self._checks[result.monitor_id] = self._checks[result.monitor_id][:20]

    def _sync_incident_state(self, monitor: Monitor, result: CheckResult) -> None:
        if result.status == CheckStatus.DOWN:
            open_incident(
                monitor=monitor,
                error=result.error,
                status_code=result.status_code,
            )
            return

        resolve_incident(monitor_id=monitor.id)


check_service = CheckService()


def check_status_to_monitor_status(status: CheckStatus) -> MonitorStatus:
    if status == CheckStatus.UP:
        return MonitorStatus.UP

    return MonitorStatus.DOWN