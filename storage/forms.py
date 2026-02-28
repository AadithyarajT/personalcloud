from django import forms
from django.conf import settings
from .models import CloudFile


class FileUploadForm(forms.ModelForm):
    class Meta:
        model = CloudFile
        fields = ["file", "visibility", "category"]
        widgets = {
            "visibility": forms.Select(attrs={"class": "form-select"}),
        }
