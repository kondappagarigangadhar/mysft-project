import asyncio
from azure.communication.email import EmailClient
from app.cloud.base import EmailProvider
from app.core.config import settings


class AzureEmail(EmailProvider):
    def __init__(self):
        self._conn_str = settings.AZURE_COMM_SERVICES_CONN_STR

    def _send_sync(self, to: str, subject: str, html_body: str) -> None:
        client = EmailClient.from_connection_string(self._conn_str)
        message = {
            "senderAddress": "noreply@arris.ai",
            "recipients": {"to": [{"address": to}]},
            "content": {"subject": subject, "html": html_body},
        }
        poller = client.begin_send(message)
        poller.result()

    async def send_email(self, to: str, subject: str, html_body: str) -> None:
        await asyncio.to_thread(self._send_sync, to, subject, html_body)
