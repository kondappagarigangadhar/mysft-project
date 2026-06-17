import asyncio
from azure.communication.sms import SmsClient
from app.cloud.base import SMSProvider
from app.core.config import settings


class AzureSMS(SMSProvider):
    def __init__(self):
        self._conn_str = settings.AZURE_COMM_SERVICES_CONN_STR

    def _send_sync(self, to: str, message: str) -> None:
        client = SmsClient.from_connection_string(self._conn_str)
        client.send(from_="ARRIS", to=[to], message=message)

    async def send_sms(self, to: str, message: str) -> None:
        await asyncio.to_thread(self._send_sync, to, message)
