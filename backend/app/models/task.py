from dataclasses import dataclass
from datetime import datetime


@dataclass
class Task:
    id: str
    roadmap_week_id: str
    title: str
    description: str | None
    requirements: list[str]
    acceptance_criteria: list[str]
    difficulty: str | None
    estimated_hours: float | None
    resources: list[dict]
    deadline: datetime | None
    status: str
