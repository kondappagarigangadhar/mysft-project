from azure.communication.sms import SmsClient
from app.cloud.base import SMSProvider
from app.core.config import settings


class AzureSMS(SMSProvider):
    def __init__(self):
        self._client = SmsClient.from_connection_string(settings.AZURE_COMM_SERVICES_CONN_STR)

    async def send_sms(self, to: str, message: str) -> None:
        self._client.send(from_="ARRIS", to=[to], message=message)
