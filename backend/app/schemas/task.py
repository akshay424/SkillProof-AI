from datetime import datetime

from pydantic import BaseModel


class TaskOut(BaseModel):
    id: str
    title: str
    description: str | None = None
    requirements: list[str] = []
    acceptance_criteria: list[str] = []
    difficulty: str | None = None
    estimated_hours: float | None = None
    resources: list[dict] = []
    deadline: datetime | None = None
    status: str


class TaskGenerateRequest(BaseModel):
    """Contract for the future AI task-generation endpoint."""

    roadmap_week_id: str
