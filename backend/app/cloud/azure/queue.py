import json
from azure.servicebus import ServiceBusClient, ServiceBusMessage
from app.cloud.base import QueueProvider
from app.core.config import settings


class AzureServiceBusQueue(QueueProvider):
    def __init__(self):
        self._client = ServiceBusClient.from_connection_string(settings.AZURE_SERVICEBUS_CONN_STR)

    async def send_message(self, queue: str, payload: dict) -> None:
        with self._client.get_queue_sender(queue_name=queue) as sender:
            sender.send_messages(ServiceBusMessage(json.dumps(payload)))

    async def receive_messages(self, queue: str, max_count: int = 10) -> list[dict]:
        messages = []
        with self._client.get_queue_receiver(queue_name=queue, max_wait_time=5) as receiver:
            for msg in receiver.receive_messages(max_message_count=max_count):
                messages.append({"body": json.loads(str(msg)), "receipt_handle": str(msg.lock_token)})
        return messages

    async def delete_message(self, queue: str, receipt_handle: str) -> None:
        # Messages are completed inside the receiver context; this is a no-op placeholder
        pass
