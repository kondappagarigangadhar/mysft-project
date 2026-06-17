import asyncio
import boto3
from app.cloud.base import StorageProvider
from app.core.config import settings


class S3Storage(StorageProvider):
    def __init__(self):
        self._client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        self._bucket = settings.AWS_S3_BUCKET

    async def upload_file(self, key: str, data: bytes, content_type: str) -> str:
        await asyncio.to_thread(
            self._client.put_object,
            Bucket=self._bucket, Key=key, Body=data, ContentType=content_type,
        )
        return key

    async def get_signed_url(self, key: str, expires_in: int = 3600) -> str:
        return await asyncio.to_thread(
            self._client.generate_presigned_url,
            "get_object",
            Params={"Bucket": self._bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    async def delete_file(self, key: str) -> None:
        await asyncio.to_thread(
            self._client.delete_object, Bucket=self._bucket, Key=key,
        )
