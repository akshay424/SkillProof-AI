from datetime import datetime

from pydantic import BaseModel


class EvaluationReportOut(BaseModel):
    """Mirrors evaluation_reports jsonb columns — the future AI review
    pipeline's response contract."""

    id: str
    submission_id: str
    architecture: dict | None = None
    folder_structure: dict | None = None
    problem_solving: dict | None = None
    code_quality: dict | None = None
    ai_usage: dict | None = None
    evidence: dict | None = None
    suggestions: list[str] = []
    confidence: float | None = None
    overall_score: float | None = None
    generated_at: datetime
