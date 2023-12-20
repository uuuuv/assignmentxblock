# Assignment XBlock

Thay đổi ở version 0.3.0: 
- Chấm và hiển thị kết quả theo từng đặc tả. Không nhận xét chung nữa. 

## Requirements

Might get 403 if use different package versions.

```conf
botocore==1.31.31
boto3==1.28.31
boto==2.49.0
```

Need to set `PORTAL_HOST` to Site Configuration. Read this: https://github.com/FUNiX-Tech/edx-platform/wiki/Site-Configurations.  

## Config (If you do not intend to use S3, you can skip this)


devstack: /edx/etc/lms.yml and /edx/etc/studio.yml.  
tutor: using tutor plugin.

**devstack lms.yml and studio.yml**

```yml
ASSIGNMENTXBLOCK_STORAGE: s3 # possible values: s3, django-storage. Default to django-storage if not set

# if ASSIGNMENTXBLOCK_STORAGE is s3, must set the following, otherwise will get MissingS3ConfigException
AWS_S3_REGION_NAME: your_value
AWS_S3_ACCESS_KEY_ID: your_value
AWS_S3_SECRET_ACCESS_KEY: your_value
AWS_S3_BUCKET_NAME: your_value
```

**tutor plugin**

```python
from tutor import hooks

hooks.Filters.ENV_PATCHES.add_items([
    (
        "lms-env",
        """
AWS_S3_REGION_NAME: your_value
AWS_S3_ACCESS_KEY_ID: your_value
AWS_S3_SECRET_ACCESS_KEY: your_value
AWS_S3_BUCKET_NAME: your_value
ASSIGNMENTXBLOCK_STORAGE: your_value
"""
    ),
    (
        "cms-env",
        """
AWS_S3_REGION_NAME: your_value
AWS_S3_ACCESS_KEY_ID: your_value
AWS_S3_SECRET_ACCESS_KEY: your_value
AWS_S3_BUCKET_NAME: your_value
ASSIGNMENTXBLOCK_STORAGE: your_value
"""
    )
])
```
