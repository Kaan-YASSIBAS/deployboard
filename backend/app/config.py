import os

from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "DeployBoard API"
    app_version: str = "0.1.0"
    environment: str = os.getenv("ENVIRONMENT", "development")

    storage_backend: str = os.getenv("STORAGE_BACKEND", "memory")
    aws_region: str = os.getenv("AWS_REGION", "eu-north-1")

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