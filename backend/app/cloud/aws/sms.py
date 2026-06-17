import asyncio
import boto3
from app.cloud.base import SMSProvider
from app.core.config import settings


class SNSSms(SMSProvider):
    def __init__(self):
        self._client = boto3.client(
            "sns",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

    async def send_sms(self, to: str, message: str) -> None:
        await asyncio.to_thread(
            self._client.publish,
            PhoneNumber=to,
            Message=message,
            MessageAttributes={
                "AWS.SNS.SMS.SenderID": {"DataType": "String", "StringValue": settings.AWS_SNS_SMS_SENDER},
                "AWS.SNS.SMS.SMSType": {"DataType": "String", "StringValue": "Transactional"},
            },
        )
