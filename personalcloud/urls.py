from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('storage/', include('storage.urls')),
    path('dashboard/', include('storage.urls_dashboard')),
    path('', RedirectView.as_view(url='/dashboard/', permanent=False)),
]

# Serve media files in development only (NOT for production)
# In production, use a proper web server or django-sendfile
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
