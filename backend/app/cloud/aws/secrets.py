import asyncio
import boto3
from app.cloud.base import SecretsProvider
from app.core.config import settings


class AWSSecrets(SecretsProvider):
    def __init__(self):
        self._client = boto3.client(
            "secretsmanager",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

    async def get_secret(self, name: str) -> str:
        resp = await asyncio.to_thread(self._client.get_secret_value, SecretId=name)
        return resp.get("SecretString", "")
