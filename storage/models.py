import uuid
import os
from django.db import models
from django.contrib.auth.models import User


def user_file_path(instance, filename):
    return f"files/{instance.owner.id}/{instance.id}/{filename}"


class CloudFile(models.Model):
    VISIBILITY_PRIVATE = "private"
    VISIBILITY_SHARED = "shared"
    VISIBILITY_CHOICES = [
        ("private", "Private"),
        ("shared", "Shared"),
    ]

    CATEGORY_MUSIC = "music"
    CATEGORY_VIDEO = "video"
    CATEGORY_DOCUMENT = "document"
    CATEGORY_PHOTO = "photo"
    CATEGORY_OTHER = "other"
    CATEGORY_CHOICES = [
        ("music", "Music"),
        ("video", "Video"),
        ("document", "Document"),
        ("photo", "Photo"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to=user_file_path)
    filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(default=0)
    content_type = models.CharField(max_length=100)
    visibility = models.CharField(
        max_length=10, choices=VISIBILITY_CHOICES, default="private"
    )
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default="other"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.filename} ({self.owner.username})"

    def get_file_size_display(self):
        size = self.file_size
        for unit in ["B", "KB", "MB", "GB"]:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"

    def get_icon(self):
        ct = self.content_type
        if ct.startswith("image/"):
            return "image"
        elif ct.startswith("video/"):
            return "video"
        elif ct.startswith("audio/"):
            return "audio"
        elif ct == "application/pdf":
            return "pdf"
        elif "zip" in ct or "compressed" in ct:
            return "archive"
        elif "word" in ct or "document" in ct:
            return "document"
        elif "excel" in ct or "spreadsheet" in ct:
            return "spreadsheet"
        elif ct.startswith("text/"):
            return "text"
        return "file"

    @staticmethod
    def detect_category(content_type):
        if content_type.startswith("audio/"):
            return "music"
        elif content_type.startswith("video/"):
            return "video"
        elif content_type.startswith("image/"):
            return "photo"
        elif content_type in [
            "application/pdf",
            "text/plain",
            "text/csv",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ]:
            return "document"
        return "other"

    def delete(self, *args, **kwargs):
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)
