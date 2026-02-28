from django.urls import path
from . import views

urlpatterns = [
    path("upload/", views.upload_file_view, name="upload_file"),
    path("download/<uuid:file_id>/", views.download_file_view, name="download_file"),
    path("stream/<uuid:file_id>/", views.stream_file_view, name="stream_file"),
    path("delete/<uuid:file_id>/", views.delete_file_view, name="delete_file"),
    path(
        "toggle/<uuid:file_id>/", views.toggle_visibility_view, name="toggle_visibility"
    ),
]
