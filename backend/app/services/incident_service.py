from datetime import datetime, timezone
from typing import List, Optional

from app.config import settings
from app.models.incident import Incident, IncidentStatus
from app.models.monitor import Monitor
from app.repositories.incident_repository import IncidentRepository


incidents: List[Incident] = []


_repository = (
    IncidentRepository()
    if settings.storage_backend == "dynamodb"
    else None
)


def list_incidents() -> List[Incident]:
    if _repository:
        return _repository.list_incidents()

    return sorted(incidents, key=lambda incident: incident.started_at, reverse=True)


def list_active_incidents() -> List[Incident]:
    if _repository:
        return _repository.list_active_incidents()

    return [
        incident
        for incident in list_incidents()
        if incident.status == IncidentStatus.ACTIVE
    ]


def get_active_incident_for_monitor(monitor_id: str) -> Optional[Incident]:
    if _repository:
        return _repository.get_active_incident_for_monitor(monitor_id)

    for incident in incidents:
        if incident.monitor_id == monitor_id and incident.status == IncidentStatus.ACTIVE:
            return incident

    return None


def open_incident(
    monitor: Monitor,
    error: Optional[str],
    status_code: Optional[int],
) -> Incident:
    active_incident = get_active_incident_for_monitor(monitor.id)

    if active_incident:
        updated_incident = active_incident.model_copy(
            update={
                "last_error": error,
                "last_status_code": status_code,
            }
        )

        if _repository:
            return _repository.save_incident(updated_incident)

        active_incident.last_error = error
        active_incident.last_status_code = status_code
        return active_incident

    incident = Incident(
        monitor_id=monitor.id,
        monitor_name=monitor.name,
        monitor_url=str(monitor.url),
        last_error=error,
        last_status_code=status_code,
    )

    if _repository:
        return _repository.save_incident(incident)

    incidents.append(incident)
    return incident


def resolve_incident(monitor_id: str) -> Optional[Incident]:
    active_incident = get_active_incident_for_monitor(monitor_id)

    if not active_incident:
        return None

    resolved_incident = active_incident.model_copy(
        update={
            "status": IncidentStatus.RESOLVED,
            "resolved_at": datetime.now(timezone.utc),
        }
    )

    if _repository:
        return _repository.save_incident(resolved_incident)

    active_incident.status = IncidentStatus.RESOLVED
    active_incident.resolved_at = resolved_incident.resolved_at

    return active_incident