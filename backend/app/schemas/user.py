from datetime import datetime

from pydantic import BaseModel


class UserProfileOut(BaseModel):
    id: str
    organization_id: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    role: str
    supervisor_id: str | None = None
    job_title: str | None = None
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None
    job_title: str | None = None
