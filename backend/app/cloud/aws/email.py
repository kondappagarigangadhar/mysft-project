import boto3
from app.cloud.base import EmailProvider
from app.core.config import settings


class SESEmail(EmailProvider):
    def __init__(self):
        self._client = boto3.client(
            "ses",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

    async def send_email(self, to: str, subject: str, html_body: str) -> None:
        self._client.send_email(
            Source=settings.AWS_SES_FROM_EMAIL,
            Destination={"ToAddresses": [to]},
            Message={
                "Subject": {"Data": subject},
                "Body": {"Html": {"Data": html_body}},
            },
        )
