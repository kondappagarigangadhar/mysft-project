from functools import lru_cache
from app.core.config import settings
from app.cloud.base import StorageProvider, QueueProvider, SecretsProvider, EmailProvider, SMSProvider


@lru_cache
def get_storage() -> StorageProvider:
    if settings.CLOUD_PROVIDER == "aws":
        from app.cloud.aws.storage import S3Storage
        return S3Storage()
    from app.cloud.azure.storage import AzureBlobStorage
    return AzureBlobStorage()


@lru_cache
def get_queue() -> QueueProvider:
    if settings.CLOUD_PROVIDER == "aws":
        from app.cloud.aws.queue import SQSQueue
        return SQSQueue()
    from app.cloud.azure.queue import AzureServiceBusQueue
    return AzureServiceBusQueue()


@lru_cache
def get_secrets() -> SecretsProvider:
    if settings.CLOUD_PROVIDER == "aws":
        from app.cloud.aws.secrets import AWSSecrets
        return AWSSecrets()
    from app.cloud.azure.secrets import AzureKeyVault
    return AzureKeyVault()


@lru_cache
def get_email() -> EmailProvider:
    if settings.CLOUD_PROVIDER == "aws":
        from app.cloud.aws.email import SESEmail
        return SESEmail()
    from app.cloud.azure.email import AzureEmail
    return AzureEmail()


@lru_cache
def get_sms() -> SMSProvider:
    if settings.CLOUD_PROVIDER == "aws":
        from app.cloud.aws.sms import SNSSms
        return SNSSms()
    from app.cloud.azure.sms import AzureSMS
    return AzureSMS()
