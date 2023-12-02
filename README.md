# Assignment XBlock

## Requirements

Might get 403 if use different package versions.

```conf
botocore==1.31.31
boto3==1.28.31
boto==2.49.0
```

## Config

devstack: /edx/etc/lms.yml and /edx/etc/studio.yml.  
tutor: using tutor plugin.

**devstack lms.yml and studio.yml**

```yml
PORTAL_SUBMIT_URL: your_value # url to submit to portal
PORTAL_GET_SUBMISSION_URL: your_value # url to get data about an assignment of a student: submision status, results, history.
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
PORTAL_SUBMIT_URL: your_value
PORTAL_GET_SUBMISSION_URL: your_value
ASSIGNMENTXBLOCK_STORAGE: your_value
LMS_HOST: your_value
"""
    ),
    (
        "cms-env",
        """
AWS_S3_REGION_NAME: your_value
AWS_S3_ACCESS_KEY_ID: your_value
AWS_S3_SECRET_ACCESS_KEY: your_value
AWS_S3_BUCKET_NAME: your_value
PORTAL_SUBMIT_URL: your_value
PORTAL_GET_SUBMISSION_URL: your_value
ASSIGNMENTXBLOCK_STORAGE: your_value
LMS_HOST: your_value
"""
    )
])
```
