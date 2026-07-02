import os

from pydantic import BaseModel, Field, SecretStr


class Settings(BaseModel):
    app_name: str = "DeployBoard API"
    app_version: str = "0.1.0"
    environment: str = os.getenv("ENVIRONMENT", "development")

    storage_backend: str = os.getenv("STORAGE_BACKEND", "memory")
    aws_region: str = os.getenv("AWS_REGION", "eu-north-1")

    jwt_secret_key: SecretStr | None = Field(
        default=os.getenv("JWT_SECRET_KEY")
        or (
            "deployboard-local-development-secret-change-me"
            if os.getenv("ENVIRONMENT", "development") == "development"
            else None
        ),
        validate_default=True,
    )
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
    max_monitors_per_user: int = int(os.getenv("MAX_MONITORS_PER_USER", "5"))
    check_history_ttl_days: int = int(os.getenv("CHECK_HISTORY_TTL_DAYS", "30"))

    dynamodb_users_table: str = os.getenv(
        "DYNAMODB_USERS_TABLE",
        "deployboard-users",
    )

    dynamodb_monitors_table: str = os.getenv(
        "DYNAMODB_MONITORS_TABLE",
        "deployboard-monitors",
    )
    dynamodb_checks_table: str = os.getenv(
        "DYNAMODB_CHECKS_TABLE",
        "deployboard-checks",
    )
    dynamodb_incidents_table: str = os.getenv(
        "DYNAMODB_INCIDENTS_TABLE",
        "deployboard-incidents",
    )


settings = Settings()
