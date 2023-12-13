from django.conf import settings

def get_config(env_key, default = None):
    return getattr(settings, env_key, default)

# api
PORTAL_HOST = get_config('PORTAL_HOST')
PORTAL_GET_SUBMISSION_URL = f"{PORTAL_HOST}/api/v1/project/user"
PORTAL_SUBMIT_URL = f"{PORTAL_HOST}/api/v1/project/submission"
PORTAL_CANCEL_SUBMISSION_URL = f"{PORTAL_HOST}/api/v1/project/submission/cancel"


from openedx.core.djangoapps.site_configuration.models import SiteConfiguration
from django.contrib.sites.models import Site

def get_site_config(site_name, setting_name):
    try:
        site = Site.objects.get(name=site_name)
        site_config = SiteConfiguration.objects.get(site=site)
        return site_config.get_value(setting_name)
    except Exception as e:
        print(str(e))
        return None

portal_domain = get_site_config('openedx', 'portal_host')
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)
print(portal_domain)