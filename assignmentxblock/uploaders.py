from .config import get_config
from django.core.files.storage import default_storage
from django.conf import settings
from abc import ABC, abstractstaticmethod
from botocore.config import Config
import boto3
import requests
import logging

class UploaderBase(ABC):

    @abstractstaticmethod
    def upload(file_key, file):
        pass

    @abstractstaticmethod
    def _get_download_url(file_key):
        pass


class DjangoStorageUploader(UploaderBase):

    @staticmethod
    def upload(file_key, file):
        default_storage.save(file_key, file.file)
        return DjangoStorageUploader._get_download_url(file_key)

    @staticmethod
    def _get_download_url(object_key):
        LMS_BASE = get_config('LMS_BASE', '')
        subfix = f"{settings.MEDIA_URL}{object_key}"

        if LMS_BASE == 'localhost:18000':
            return f"http://localhost:18000{subfix}"
         
        return f"https://{LMS_BASE}{subfix}"
    
class S3Uploader(UploaderBase):
    AWS_S3_REGION_NAME = get_config('AWS_S3_REGION_NAME')
    AWS_S3_ACCESS_KEY_ID = get_config('AWS_S3_ACCESS_KEY_ID')
    AWS_S3_SECRET_ACCESS_KEY = get_config('AWS_S3_SECRET_ACCESS_KEY')
    AWS_S3_BUCKET_NAME = get_config('AWS_S3_BUCKET_NAME')
    ExpiresIn = 100000

    @staticmethod
    def upload(file_key, file):
        upload_url = S3Uploader._get_presigned_url(file_key)

        response = requests.put(upload_url, data=file)

        if response.status_code == 200:
            download_url = S3Uploader._get_download_url(file_key)
            return download_url
        else:
            try:
                data = response.json()
                logging.error(f"Failed to upload file {file_key}")
                logging.error(f"Failed to upload file: ", data)
                return None
            except Exception as e: 
                logging.error(str(e))
                return None
    
    @staticmethod
    def _get_s3_client():
        config = Config(
            region_name=S3Uploader.AWS_S3_REGION_NAME, 
            signature_version='v4'
        )

        s3_client = boto3.client(
            's3', 
            config=config, 
            aws_access_key_id=S3Uploader.AWS_S3_ACCESS_KEY_ID,
            aws_secret_access_key=S3Uploader.AWS_S3_SECRET_ACCESS_KEY
        )

        return s3_client
    
    @staticmethod
    def _get_download_url(object_key):
        return f"https://{S3Uploader.AWS_S3_BUCKET_NAME}.s3.{S3Uploader.AWS_S3_REGION_NAME}.amazonaws.com/{object_key}"
    
    @staticmethod
    def _get_presigned_url(file_key):
        s3_client = S3Uploader._get_s3_client()

        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={'Bucket': S3Uploader.AWS_S3_BUCKET_NAME, 'Key': file_key},
            ExpiresIn=S3Uploader.ExpiresIn
        )

        return presigned_url
        
