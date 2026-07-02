from typing import List

from boto3.dynamodb.conditions import Key

from app.models.check import CheckResult
from app.repositories.dynamodb import get_checks_table


class CheckRepository:
    def __init__(self) -> None:
        self._table = get_checks_table()

    def list_checks_for_monitor(self, monitor_id: str, limit: int = 20) -> List[CheckResult]:
        response = self._table.query(
            KeyConditionExpression=Key("monitor_id").eq(monitor_id),
            ScanIndexForward=False,
            Limit=limit,
        )

        items = response.get("Items", [])

        return [self._item_to_check(item) for item in items]

    def save_check(self, check: CheckResult) -> CheckResult:
        self._table.put_item(Item=self._check_to_item(check))
        return check

    def _check_to_item(self, check: CheckResult) -> dict:
        return check.model_dump(mode="json")

    def _item_to_check(self, item: dict) -> CheckResult:
        return CheckResult(**item)