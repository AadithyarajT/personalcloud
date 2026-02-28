from django.urls import path
from storage.views import dashboard_view

urlpatterns = [
    path('', dashboard_view, name='dashboard'),
]
