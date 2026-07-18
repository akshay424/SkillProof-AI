from dataclasses import dataclass
from datetime import datetime


@dataclass
class EvaluationReportRecord:
    id: str
    submission_id: str
    user_id: str
    architecture: dict | None
    folder_structure: dict | None
    problem_solving: dict | None
    code_quality: dict | None
    ai_usage: dict | None
    evidence: dict | None
    suggestions: dict | None
    confidence: float | None
    overall_score: float | None
    raw_report: dict | None
    generated_at: datetime
