import os
import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import Http404, FileResponse, StreamingHttpResponse, JsonResponse
from django.contrib import messages
from django.db.models import Q, Sum
from .models import CloudFile
from .forms import FileUploadForm


@login_required
def dashboard_view(request):
    my_files = CloudFile.objects.filter(owner=request.user)
    shared_files = CloudFile.objects.filter(
        visibility=CloudFile.VISIBILITY_SHARED
    ).exclude(owner=request.user)

    my_files_count = my_files.count()
    my_storage = my_files.aggregate(total=Sum("file_size"))["total"] or 0
    storage_display = format_bytes(my_storage)

    music_files = (
        CloudFile.objects.filter(category="music")
        .filter(Q(owner=request.user) | Q(visibility="shared"))
        .order_by("filename")
    )

    video_files = (
        CloudFile.objects.filter(category="video")
        .filter(Q(owner=request.user) | Q(visibility="shared"))
        .order_by("filename")
    )

    context = {
        "my_files": my_files,
        "shared_files": shared_files,
        "my_files_count": my_files_count,
        "storage_used": storage_display,
        "upload_form": FileUploadForm(),
        "music_playlist": music_files,
        "video_playlist": video_files,
    }
    return render(request, "storage/dashboard.html", context)


@login_required
def upload_file_view(request):
    if request.method == "POST":
        form = FileUploadForm(request.POST, request.FILES)
        if form.is_valid():
            cloud_file = form.save(commit=False)
            cloud_file.owner = request.user
            cloud_file.filename = request.FILES["file"].name
            cloud_file.file_size = request.FILES["file"].size
            cloud_file.content_type = request.FILES["file"].content_type
            if not cloud_file.category or cloud_file.category == "other":
                cloud_file.category = CloudFile.detect_category(cloud_file.content_type)
            cloud_file.save()
            messages.success(request, f'"{cloud_file.filename}" uploaded successfully.')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, error)
    return redirect("dashboard")


@login_required
def stream_file_view(request, file_id):
    cloud_file = get_object_or_404(CloudFile, id=file_id)

    if cloud_file.owner != request.user:
        if cloud_file.visibility != CloudFile.VISIBILITY_SHARED:
            raise Http404("File not found or access denied.")

    try:
        file_path = cloud_file.file.path
        file_size = os.path.getsize(file_path)
        content_type = cloud_file.content_type
        range_header = request.META.get("HTTP_RANGE", "").strip()

        if range_header:
            range_match = range_header.replace("bytes=", "").split("-")
            start = int(range_match[0]) if range_match[0] else 0
            end = int(range_match[1]) if range_match[1] else file_size - 1
            end = min(end, file_size - 1)
            length = end - start + 1

            def file_iterator(path, offset, length, chunk=65536):
                with open(path, "rb") as f:
                    f.seek(offset)
                    remaining = length
                    while remaining > 0:
                        data = f.read(min(chunk, remaining))
                        if not data:
                            break
                        remaining -= len(data)
                        yield data

            response = StreamingHttpResponse(
                file_iterator(file_path, start, length),
                status=206,
                content_type=content_type,
            )
            response["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            response["Content-Length"] = str(length)
            response["Accept-Ranges"] = "bytes"
            return response

        response = FileResponse(open(file_path, "rb"), content_type=content_type)
        response["Content-Length"] = str(file_size)
        response["Accept-Ranges"] = "bytes"
        response["Content-Disposition"] = f'inline; filename="{cloud_file.filename}"'
        return response

    except FileNotFoundError:
        raise Http404("File not found on disk.")


@login_required
def download_file_view(request, file_id):
    cloud_file = get_object_or_404(CloudFile, id=file_id)
    if cloud_file.owner != request.user:
        if cloud_file.visibility != CloudFile.VISIBILITY_SHARED:
            raise Http404("File not found or access denied.")
    try:
        response = FileResponse(
            open(cloud_file.file.path, "rb"), content_type=cloud_file.content_type
        )
        response["Content-Disposition"] = (
            f'attachment; filename="{cloud_file.filename}"'
        )
        response["Content-Length"] = cloud_file.file_size
        return response
    except FileNotFoundError:
        raise Http404("File not found on disk.")


@login_required
def delete_file_view(request, file_id):
    cloud_file = get_object_or_404(CloudFile, id=file_id, owner=request.user)
    if request.method == "POST":
        filename = cloud_file.filename
        cloud_file.delete()
        messages.success(request, f'"{filename}" deleted successfully.')
    return redirect("dashboard")


@login_required
def toggle_visibility_view(request, file_id):
    cloud_file = get_object_or_404(CloudFile, id=file_id, owner=request.user)
    if request.method == "POST":
        if cloud_file.visibility == CloudFile.VISIBILITY_PRIVATE:
            cloud_file.visibility = CloudFile.VISIBILITY_SHARED
            msg = f'"{cloud_file.filename}" is now shared.'
        else:
            cloud_file.visibility = CloudFile.VISIBILITY_PRIVATE
            msg = f'"{cloud_file.filename}" is now private.'
        cloud_file.save()
        messages.success(request, msg)
    return redirect("dashboard")


def format_bytes(size):
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"
