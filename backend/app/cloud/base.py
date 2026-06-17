from abc import ABC, abstractmethod


class StorageProvider(ABC):
    @abstractmethod
    async def upload_file(self, key: str, data: bytes, content_type: str) -> str:
        """Upload file and return its storage key/path."""

    @abstractmethod
    async def get_signed_url(self, key: str, expires_in: int = 3600) -> str:
        """Return a temporary pre-signed URL for the object."""

    @abstractmethod
    async def delete_file(self, key: str) -> None:
        """Delete a file from storage."""


class QueueProvider(ABC):
    @abstractmethod
    async def send_message(self, queue: str, payload: dict) -> None:
        """Push a JSON message onto the queue."""

    @abstractmethod
    async def receive_messages(self, queue: str, max_count: int = 10) -> list[dict]:
        """Poll and return messages from the queue."""

    @abstractmethod
    async def delete_message(self, queue: str, receipt_handle: str) -> None:
        """Acknowledge and delete a processed message."""


class SecretsProvider(ABC):
    @abstractmethod
    async def get_secret(self, name: str) -> str:
        """Retrieve a secret value by name."""


class EmailProvider(ABC):
    @abstractmethod
    async def send_email(self, to: str, subject: str, html_body: str) -> None:
        """Send a transactional email."""


class SMSProvider(ABC):
    @abstractmethod
    async def send_sms(self, to: str, message: str) -> None:
        """Send an SMS message."""
