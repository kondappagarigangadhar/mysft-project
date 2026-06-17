import json
import boto3
from app.cloud.base import QueueProvider
from app.core.config import settings


class SQSQueue(QueueProvider):
    def __init__(self):
        self._client = boto3.client(
            "sqs",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

    def _get_url(self, queue: str) -> str:
        resp = self._client.get_queue_url(QueueName=queue)
        return resp["QueueUrl"]

    async def send_message(self, queue: str, payload: dict) -> None:
        self._client.send_message(QueueUrl=self._get_url(queue), MessageBody=json.dumps(payload))

    async def receive_messages(self, queue: str, max_count: int = 10) -> list[dict]:
        resp = self._client.receive_message(
            QueueUrl=self._get_url(queue), MaxNumberOfMessages=max_count, WaitTimeSeconds=5
        )
        messages = []
        for msg in resp.get("Messages", []):
            messages.append({"body": json.loads(msg["Body"]), "receipt_handle": msg["ReceiptHandle"]})
        return messages

    async def delete_message(self, queue: str, receipt_handle: str) -> None:
        self._client.delete_message(QueueUrl=self._get_url(queue), ReceiptHandle=receipt_handle)
