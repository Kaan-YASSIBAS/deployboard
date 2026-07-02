from typing import List, Optional

from app.models.incident import Incident, IncidentStatus
from app.repositories.dynamodb import get_incidents_table


class IncidentRepository:
    def __init__(self) -> None:
        self._table = get_incidents_table()

    def list_incidents(self) -> List[Incident]:
        items = []
        response = self._table.scan()

        items.extend(response.get("Items", []))

        while "LastEvaluatedKey" in response:
            response = self._table.scan(
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            items.extend(response.get("Items", []))

        incidents = [self._item_to_incident(item) for item in items]

        return sorted(
            incidents,
            key=lambda incident: incident.started_at,
            reverse=True,
        )

    def list_active_incidents(self) -> List[Incident]:
        return [
            incident
            for incident in self.list_incidents()
            if incident.status == IncidentStatus.ACTIVE
        ]

    def get_active_incident_for_monitor(self, monitor_id: str) -> Optional[Incident]:
        for incident in self.list_active_incidents():
            if incident.monitor_id == monitor_id:
                return incident

        return None

    def save_incident(self, incident: Incident) -> Incident:
        self._table.put_item(Item=self._incident_to_item(incident))
        return incident

    def _incident_to_item(self, incident: Incident) -> dict:
        return incident.model_dump(mode="json")

    def _item_to_incident(self, item: dict) -> Incident:
        return Incident(**item)