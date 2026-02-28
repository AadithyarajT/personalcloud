# ☁ PersonalCloud

A secure personal cloud file storage web application built with Django + PostgreSQL.

## Features

- 🔐 User authentication (register, login, profile, password change)
- ☁ File upload/download with UUID-based IDs
- 🔒 Private & shared file visibility
- 📱 Responsive — works on mobile & desktop
- 🛡 CSRF protection, permission checks, file type validation
- 🏗 Future-ready: accounts + storage app structure

---

## Folder Structure

```
personalcloud/
├── manage.py
├── requirements.txt
├── .env.example
├── personalcloud/          # Project config
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── accounts/               # Auth & Profile app
│   ├── models.py           # UserProfile
│   ├── views.py
│   ├── forms.py
│   ├── urls.py
│   └── templates/accounts/
│       ├── login.html
│       ├── register.html
│       ├── profile.html
│       ├── edit_profile.html
│       └── change_password.html
├── storage/                # File storage app
│   ├── models.py           # CloudFile (UUID pk)
│   ├── views.py
│   ├── forms.py
│   ├── urls.py
│   ├── urls_dashboard.py
│   └── templates/storage/
│       └── dashboard.html
├── templates/
│   └── base.html           # Shared base template
├── static/
│   ├── css/main.css
│   └── js/main.js
└── media/                  # Uploaded files (gitignored)
```

---

## Setup Instructions

### 1. Prerequisites

- Python 3.10+
- PostgreSQL 14+
- pip

### 2. Clone & Create Virtual Environment

```bash
git clone <your-repo>
cd personalcloud

python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. PostgreSQL Setup

```sql
-- In psql:
CREATE DATABASE personalcloud;
CREATE USER clouduser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE personalcloud TO clouduser;
```

### 5. Environment Variables

```bash
cp .env.example .env
# Edit .env with your values
```

Then update `settings.py` to use decouple (optional), or set env vars directly.

### 6. Run Migrations

```bash
python manage.py makemigrations accounts storage
python manage.py migrate
```

### 7. Create Superuser (optional)

```bash
python manage.py createsuperuser
```

### 8. Collect Static Files (production only)

```bash
python manage.py collectstatic
```

### 9. Run Development Server

```bash
python manage.py runserver
```

Visit: **http://localhost:8000**

---

## Security Notes

- Never expose `media/` files directly in production — use nginx `X-Accel-Redirect` or `django-sendfile`
- Set `DEBUG=False` and proper `ALLOWED_HOSTS` in production
- Use environment variables for all secrets
- Enable HTTPS in production (`SESSION_COOKIE_SECURE=True`, etc.)

---

## Database Schema

| Table | Key Fields |
|-------|-----------|
| `auth_user` | Django default user |
| `accounts_userprofile` | OneToOne → User, bio, avatar |
| `storage_cloudfile` | UUID pk, owner FK, file, filename, file_size, content_type, visibility, uploaded_at |

---

## Future Extensions

- **Streaming**: Add range-request support in `download_file_view`
- **REST API**: Add `djangorestframework` + token auth
- **Mobile App**: Connect via REST API
- **Cloud Storage**: Swap `FileField` storage backend to S3 via `django-storages`
- **Search**: Full-text search with PostgreSQL `tsvector`
- **Sharing Links**: Expirable signed URLs

---

## URL Map

```
/                          → redirect to dashboard
/accounts/register/        → registration
/accounts/login/           → login
/accounts/logout/          → logout (POST)
/accounts/profile/         → view profile
/accounts/profile/edit/    → edit profile
/accounts/profile/password/ → change password
/dashboard/                → main dashboard
/storage/upload/           → upload file (POST)
/storage/download/<uuid>/  → download file
/storage/delete/<uuid>/    → delete file (POST)
/storage/toggle/<uuid>/    → toggle visibility (POST)
/admin/                    → Django admin
```
