from typing import Protocol

from botocore.exceptions import ClientError

from app.models.user import User
from app.repositories.dynamodb import get_users_table


class DuplicateUsernameError(Exception):
    pass


class UserRepository(Protocol):
    def get_user_by_username(self, username: str) -> User | None: ...

    def create_user(self, user: User) -> User: ...


class MemoryUserRepository:
    def __init__(self) -> None:
        self._users: dict[str, User] = {}

    def get_user_by_username(self, username: str) -> User | None:
        return self._users.get(username)

    def create_user(self, user: User) -> User:
        if user.username in self._users:
            raise DuplicateUsernameError(user.username)

        self._users[user.username] = user
        return user


class DynamoDBUserRepository:
    def __init__(self) -> None:
        self._table = get_users_table()

    def get_user_by_username(self, username: str) -> User | None:
        response = self._table.get_item(
            Key={"username": username},
            ConsistentRead=True,
        )
        item = response.get("Item")

        if item is None:
            return None

        return User(**item)

    def create_user(self, user: User) -> User:
        try:
            self._table.put_item(
                Item=user.model_dump(mode="json"),
                ConditionExpression="attribute_not_exists(username)",
            )
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code")

            if error_code == "ConditionalCheckFailedException":
                raise DuplicateUsernameError(user.username) from exc

            raise

        return user
