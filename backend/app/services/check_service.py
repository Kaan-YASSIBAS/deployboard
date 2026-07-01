import time

import httpx

from app.models.check import CheckResult, CheckStatus
from app.models.monitor import Monitor, MonitorStatus


class CheckService:
    def __init__(self) -> None:
        self._checks: dict[str, list[CheckResult]] = {}

    def list_checks_for_monitor(self, monitor_id: str) -> list[CheckResult]:
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

        self._checks.setdefault(monitor.id, []).insert(0, result)
        self._checks[monitor.id] = self._checks[monitor.id][:20]

        return result


check_service = CheckService()


def check_status_to_monitor_status(status: CheckStatus) -> MonitorStatus:
    if status == CheckStatus.UP:
        return MonitorStatus.UP

    return MonitorStatus.DOWN