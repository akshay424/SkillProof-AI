from dataclasses import dataclass
from datetime import datetime


@dataclass
class UserProfile:
    id: str
    organization_id: str | None
    full_name: str | None
    avatar_url: str | None
    role: str
    supervisor_id: str | None
    job_title: str | None
    created_at: datetime
    updated_at: datetime
