"""
Import worker — reads messages from the import queue and processes CSV/Excel uploads.
Run with: python -m app.workers.import_worker
"""
import asyncio
import json
from app.cloud import get_queue, get_storage
from app.db.session import init_db_pool, close_db_pool, _pool


async def process_import_job(payload: dict) -> None:
    queue = get_queue()
    storage = get_storage()
    # TODO: download file from storage, parse rows, bulk-insert into DB
    print(f"Processing import job: {payload}")


async def main() -> None:
    await init_db_pool()
    queue = get_queue()
    print("Import worker started. Polling queue...")
    while True:
        messages = await queue.receive_messages("arris-import-queue", max_count=5)
        for msg in messages:
            await process_import_job(msg["body"])
            await queue.delete_message("arris-import-queue", msg["receipt_handle"])
        await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(main())
