"""
Notification worker — reads notification events and dispatches email/SMS.
Run with: python -m app.workers.notification_worker
"""
import asyncio
from app.cloud import get_queue, get_email, get_sms


async def process_notification(payload: dict) -> None:
    channel = payload.get("channel", "email")
    if channel == "email":
        email = get_email()
        await email.send_email(payload["to"], payload["subject"], payload["body"])
    elif channel == "sms":
        sms = get_sms()
        await sms.send_sms(payload["to"], payload["body"])


async def main() -> None:
    queue = get_queue()
    print("Notification worker started. Polling queue...")
    while True:
        messages = await queue.receive_messages("arris-notification-queue", max_count=10)
        for msg in messages:
            await process_notification(msg["body"])
            await queue.delete_message("arris-notification-queue", msg["receipt_handle"])
        await asyncio.sleep(3)


if __name__ == "__main__":
    asyncio.run(main())
