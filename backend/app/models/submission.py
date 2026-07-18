from dataclasses import dataclass
from datetime import datetime


@dataclass
class Submission:
    id: str
    task_id: str
    user_id: str
    submission_type: str  # gitlab_url | zip_upload
    gitlab_url: str | None
    storage_path: str | None
    detected_project_type: str | None
    status: str
    submitted_at: datetime
