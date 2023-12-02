from .config import get_config
from .uploaders import DjangoStorageUploader, S3Uploader

class MissingS3ConfigException(Exception):
    """
    You choose to upload by s3 but you haven't set all of these: 
        - AWS_S3_REGION_NAME
        - AWS_S3_ACCESS_KEY_ID
        - AWS_S3_SECRET_ACCESS_KEY
        - AWS_S3_BUCKET_NAME
    """

ASSIGNMENTXBLOCK_STORAGE = 'ASSIGNMENTXBLOCK_STORAGE'
DJANGO_STORAGE = "django-storage"
S3_STORAGE = "s3"
DEFAULT_STORAGE = DJANGO_STORAGE

uploaders_map = {
    DJANGO_STORAGE: DjangoStorageUploader,
    S3_STORAGE: S3Uploader
}

def get_uploader():
    storage = get_config(ASSIGNMENTXBLOCK_STORAGE, DEFAULT_STORAGE)

    if storage == S3_STORAGE:
        AWS_S3_REGION_NAME = get_config('AWS_S3_REGION_NAME')
        AWS_S3_ACCESS_KEY_ID = get_config('AWS_S3_ACCESS_KEY_ID')
        AWS_S3_SECRET_ACCESS_KEY = get_config('AWS_S3_SECRET_ACCESS_KEY')
        AWS_S3_BUCKET_NAME = get_config('AWS_S3_BUCKET_NAME')

        if AWS_S3_REGION_NAME is None or AWS_S3_ACCESS_KEY_ID is None or AWS_S3_SECRET_ACCESS_KEY is None or AWS_S3_BUCKET_NAME is None:
            raise MissingS3ConfigException
        
    return uploaders_map.get(storage)
