from datetime import date, datetime

from pydantic import BaseModel


class RoadmapWeekOut(BaseModel):
    id: str
    week_number: int
    theme: str
    summary: str | None = None
    unlock_date: date | None = None
    status: str


class RoadmapOut(BaseModel):
    id: str
    title: str
    total_weeks: int
    status: str
    started_at: datetime | None = None
    target_completion_date: date | None = None
    weeks: list[RoadmapWeekOut] = []


class RoadmapGenerateRequest(BaseModel):
    """Contract for the future diagnostic -> roadmap generation endpoint."""

    diagnostic_result_id: str
