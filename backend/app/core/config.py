from typing import List, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ── App ────────────────────────────────────────────────────
    APP_NAME: str = "ARRIS AI Real Estate Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # ── Database ───────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/arris"

    # ── Auth ───────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ───────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # ── Cloud Provider Switch ──────────────────────────────────
    CLOUD_PROVIDER: Literal["aws", "azure"] = "aws"

    # ── AWS ────────────────────────────────────────────────────
    AWS_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "arris-documents"
    AWS_SQS_IMPORT_QUEUE: str = "arris-import-queue"
    AWS_SQS_EXPORT_QUEUE: str = "arris-export-queue"
    AWS_SES_FROM_EMAIL: str = "noreply@arris.ai"
    AWS_SNS_SMS_SENDER: str = "ARRIS"

    # ── Azure ──────────────────────────────────────────────────
    AZURE_BLOB_CONN_STR: str = ""
    AZURE_BLOB_CONTAINER: str = "arris-documents"
    AZURE_SERVICEBUS_CONN_STR: str = ""
    AZURE_SERVICEBUS_IMPORT_QUEUE: str = "arris-import-queue"
    AZURE_SERVICEBUS_EXPORT_QUEUE: str = "arris-export-queue"
    AZURE_COMM_SERVICES_CONN_STR: str = ""
    AZURE_KEYVAULT_URL: str = ""

    # ── Payment Gateway ────────────────────────────────────────
    PAYMENT_GATEWAY: Literal["razorpay", "cashfree"] = "razorpay"
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    CASHFREE_APP_ID: str = ""
    CASHFREE_SECRET_KEY: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
