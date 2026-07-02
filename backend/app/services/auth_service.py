from pwdlib import PasswordHash

from app.config import settings
from app.models.user import User
from app.repositories.user_repository import (
    DynamoDBUserRepository,
    MemoryUserRepository,
    UserRepository,
)


password_hash = PasswordHash.recommended()
dummy_password_hash = password_hash.hash("deployboard-dummy-password")


class AuthService:
    def __init__(self, repository: UserRepository | None = None) -> None:
        if repository is not None:
            self._repository = repository
        elif settings.storage_backend == "dynamodb":
            self._repository = DynamoDBUserRepository()
        else:
            self._repository = MemoryUserRepository()

    def register_user(self, username: str, password: str) -> User:
        user = User(
            username=username,
            password_hash=password_hash.hash(password),
        )
        return self._repository.create_user(user)

    def authenticate_user(self, username: str, password: str) -> User | None:
        user = self.get_user_by_username(username)

        if user is None:
            password_hash.verify(password, dummy_password_hash)
            return None

        if not password_hash.verify(password, user.password_hash):
            return None

        return user

    def get_user_by_username(self, username: str) -> User | None:
        return self._repository.get_user_by_username(username)


auth_service = AuthService()


def get_auth_service() -> AuthService:
    return auth_service
