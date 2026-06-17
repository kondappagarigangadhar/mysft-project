import asyncio
import json
from azure.servicebus import ServiceBusClient, ServiceBusMessage
from app.cloud.base import QueueProvider
from app.core.config import settings


class AzureServiceBusQueue(QueueProvider):
    def __init__(self):
        self._conn_str = settings.AZURE_SERVICEBUS_CONN_STR

    def _send_sync(self, queue: str, body: str) -> None:
        with ServiceBusClient.from_connection_string(self._conn_str) as client:
            with client.get_queue_sender(queue_name=queue) as sender:
                sender.send_messages(ServiceBusMessage(body))

    def _receive_sync(self, queue: str, max_count: int) -> list[dict]:
        results = []
        with ServiceBusClient.from_connection_string(self._conn_str) as client:
            with client.get_queue_receiver(queue_name=queue, max_wait_time=5) as receiver:
                msgs = receiver.receive_messages(max_message_count=max_count)
                for msg in msgs:
                    results.append({
                        "body": json.loads(str(msg)),
                        "receipt_handle": str(msg.lock_token),
                        "_msg": msg,
                    })
                    receiver.complete_message(msg)
        return results

    async def send_message(self, queue: str, payload: dict) -> None:
        await asyncio.to_thread(self._send_sync, queue, json.dumps(payload))

    async def receive_messages(self, queue: str, max_count: int = 10) -> list[dict]:
        raw = await asyncio.to_thread(self._receive_sync, queue, max_count)
        return [{"body": r["body"], "receipt_handle": r["receipt_handle"]} for r in raw]

    async def delete_message(self, queue: str, receipt_handle: str) -> None:
        # Messages are completed eagerly inside _receive_sync; this is intentionally a no-op.
        pass
