from dataclasses import dataclass, field
from datetime import date, datetime


@dataclass
class Roadmap:
    id: str
    user_id: str
    learning_path_id: str | None
    title: str
    total_weeks: int
    status: str
    started_at: datetime | None
    target_completion_date: date | None
    created_at: datetime


@dataclass
class RoadmapWeek:
    id: str
    roadmap_id: str
    week_number: int
    theme: str
    summary: str | None
    unlock_date: date | None
    status: str
