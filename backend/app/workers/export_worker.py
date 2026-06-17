"""
Export worker — reads export job requests and generates CSV/Excel/PDF files.
Run with: python -m app.workers.export_worker
"""
import asyncio
from app.cloud import get_queue, get_storage


async def process_export_job(payload: dict) -> None:
    print(f"Processing export job: {payload}")
    # TODO: query DB, generate file, upload to storage, notify user


async def main() -> None:
    queue = get_queue()
    print("Export worker started. Polling queue...")
    while True:
        messages = await queue.receive_messages("arris-export-queue", max_count=5)
        for msg in messages:
            await process_export_job(msg["body"])
            await queue.delete_message("arris-export-queue", msg["receipt_handle"])
        await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(main())
