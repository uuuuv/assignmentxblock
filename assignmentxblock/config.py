from django.conf import settings

def get_config(env_key, default = None):
    return getattr(settings, env_key, default)
