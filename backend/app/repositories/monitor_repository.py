from typing import List, Optional

from boto3.dynamodb.conditions import Key

from app.models.monitor import Monitor
from app.repositories.dynamodb import get_monitors_table


class MonitorRepository:
    def __init__(self) -> None:
        self._table = get_monitors_table()

    def list_monitors(self, user_id: str) -> List[Monitor]:
        items = []
        response = self._table.query(
            KeyConditionExpression=Key("user_id").eq(user_id),
        )

        items.extend(response.get("Items", []))

        while "LastEvaluatedKey" in response:
            response = self._table.query(
                KeyConditionExpression=Key("user_id").eq(user_id),
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            items.extend(response.get("Items", []))

        return [self._item_to_monitor(item) for item in items]

    def list_all_monitors(self) -> List[Monitor]:
        items = []
        response = self._table.scan()

        items.extend(response.get("Items", []))

        while "LastEvaluatedKey" in response:
            response = self._table.scan(
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            items.extend(response.get("Items", []))

        return [self._item_to_monitor(item) for item in items]

    def get_monitor(self, user_id: str, monitor_id: str) -> Optional[Monitor]:
        response = self._table.get_item(
            Key={
                "user_id": user_id,
                "id": monitor_id,
            }
        )

        item = response.get("Item")

        if item is None:
            return None

        return self._item_to_monitor(item)

    def save_monitor(self, monitor: Monitor) -> Monitor:
        self._table.put_item(Item=self._monitor_to_item(monitor))
        return monitor

    def delete_monitor(self, user_id: str, monitor_id: str) -> bool:
        existing_monitor = self.get_monitor(user_id, monitor_id)

        if existing_monitor is None:
            return False

        self._table.delete_item(
            Key={
                "user_id": user_id,
                "id": monitor_id,
            }
        )

        return True

    def _monitor_to_item(self, monitor: Monitor) -> dict:
        return monitor.model_dump(mode="json")

    def _item_to_monitor(self, item: dict) -> Monitor:
        return Monitor(**item)
