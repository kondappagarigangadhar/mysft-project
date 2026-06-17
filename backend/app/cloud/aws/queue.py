import asyncio
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
        self._url_cache: dict[str, str] = {}

    def _get_url(self, queue: str) -> str:
        if queue not in self._url_cache:
            resp = self._client.get_queue_url(QueueName=queue)
            self._url_cache[queue] = resp["QueueUrl"]
        return self._url_cache[queue]

    async def send_message(self, queue: str, payload: dict) -> None:
        url = await asyncio.to_thread(self._get_url, queue)
        await asyncio.to_thread(
            self._client.send_message, QueueUrl=url, MessageBody=json.dumps(payload),
        )

    async def receive_messages(self, queue: str, max_count: int = 10) -> list[dict]:
        url = await asyncio.to_thread(self._get_url, queue)
        resp = await asyncio.to_thread(
            self._client.receive_message,
            QueueUrl=url, MaxNumberOfMessages=min(max_count, 10), WaitTimeSeconds=5,
        )
        return [
            {"body": json.loads(msg["Body"]), "receipt_handle": msg["ReceiptHandle"]}
            for msg in resp.get("Messages", [])
        ]

    async def delete_message(self, queue: str, receipt_handle: str) -> None:
        url = await asyncio.to_thread(self._get_url, queue)
        await asyncio.to_thread(
            self._client.delete_message, QueueUrl=url, ReceiptHandle=receipt_handle,
        )
