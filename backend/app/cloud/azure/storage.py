from datetime import datetime, timedelta, timezone
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from app.cloud.base import StorageProvider
from app.core.config import settings


class AzureBlobStorage(StorageProvider):
    def __init__(self):
        self._client = BlobServiceClient.from_connection_string(settings.AZURE_BLOB_CONN_STR)
        self._container = settings.AZURE_BLOB_CONTAINER

    async def upload_file(self, key: str, data: bytes, content_type: str) -> str:
        blob = self._client.get_blob_client(container=self._container, blob=key)
        blob.upload_blob(data, overwrite=True, content_settings={"content_type": content_type})
        return key

    async def get_signed_url(self, key: str, expires_in: int = 3600) -> str:
        account = self._client.account_name
        account_key = self._client.credential.account_key
        sas = generate_blob_sas(
            account_name=account,
            container_name=self._container,
            blob_name=key,
            account_key=account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
        )
        return f"https://{account}.blob.core.windows.net/{self._container}/{key}?{sas}"

    async def delete_file(self, key: str) -> None:
        blob = self._client.get_blob_client(container=self._container, blob=key)
        blob.delete_blob()
