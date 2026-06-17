from azure.communication.email import EmailClient
from app.cloud.base import EmailProvider
from app.core.config import settings


class AzureEmail(EmailProvider):
    def __init__(self):
        self._client = EmailClient.from_connection_string(settings.AZURE_COMM_SERVICES_CONN_STR)

    async def send_email(self, to: str, subject: str, html_body: str) -> None:
        message = {
            "senderAddress": "noreply@arris.ai",
            "recipients": {"to": [{"address": to}]},
            "content": {"subject": subject, "html": html_body},
        }
        self._client.begin_send(message)
