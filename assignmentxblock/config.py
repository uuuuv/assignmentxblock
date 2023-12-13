from django.conf import settings
from openedx.core.djangoapps.site_configuration.models import SiteConfiguration
from django.contrib.sites.models import Site

def get_config(env_key, default = None):
    return getattr(settings, env_key, default)

def get_site_config(domain, setting_name):
    try:
        site = Site.objects.get(domain=domain)
        site_config = SiteConfiguration.objects.get(site=site)
        return site_config.get_value(setting_name)
    except Exception as e:
        print(str(e))
        return None
    
LMS_BASE = get_config('LMS_BASE')
PORTAL_HOST = get_site_config(LMS_BASE, 'PORTAL_HOST')

if PORTAL_HOST is None: 
    raise Exception("Cannot get PORTAL_HOST from SiteConfiguration")

# api
# PORTAL_HOST = get_config('PORTAL_HOST')
PORTAL_GET_SUBMISSION_URL = f"{PORTAL_HOST}/api/v1/project/user"
PORTAL_SUBMIT_URL = f"{PORTAL_HOST}/api/v1/project/submission"
PORTAL_CANCEL_SUBMISSION_URL = f"{PORTAL_HOST}/api/v1/project/submission/cancel"