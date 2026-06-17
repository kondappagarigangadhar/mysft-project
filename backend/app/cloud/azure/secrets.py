from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential
from app.cloud.base import SecretsProvider
from app.core.config import settings


class AzureKeyVault(SecretsProvider):
    def __init__(self):
        self._client = SecretClient(
            vault_url=settings.AZURE_KEYVAULT_URL,
            credential=DefaultAzureCredential(),
        )

    async def get_secret(self, name: str) -> str:
        secret = self._client.get_secret(name)
        return secret.value or ""
