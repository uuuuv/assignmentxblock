from django.conf import settings
from openedx.core.djangoapps.site_configuration.models import SiteConfiguration
from django.contrib.sites.models import Site

def get_config(env_key, default = None):
    return getattr(settings, env_key, default)

def get_site_config(domain, setting_name, default_value=None):
    try:
        site = Site.objects.filter(domain=domain).first()
        if site is None: 
            print('NOT FOUND SITE WHEN GETTING SITE CONFIG FROM ASSIGNMENTXBLOCK')
            return default_value
        site_config = SiteConfiguration.objects.filter(site=site).first()
        if site_config is None:
            print('NOT FOUND SITE WHEN GETTING SITE CONFIG FROM ASSIGNMENTXBLOCK')
            return default_value

        return site_config.get_value(setting_name, default_value)
    except Exception as e:
        print(str(e))
        return None
    
# LMS_BASE = get_config('LMS_BASE')
# PORTAL_HOST = get_site_config(LMS_BASE, 'PORTAL_HOST', 'localhost:18000')

# # api
# PORTAL_GET_SUBMISSION_URL = f"{PORTAL_HOST}/api/v1/project/user"
# PORTAL_SUBMIT_URL = f"{PORTAL_HOST}/api/v1/project/submission"
# PORTAL_CANCEL_SUBMISSION_URL = f"{PORTAL_HOST}/api/v1/project/submission/cancel"

