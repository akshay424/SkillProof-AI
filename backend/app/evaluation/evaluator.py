from dataclasses import dataclass


@dataclass
class EvaluationReport:
    """Mirrors the evaluation_reports table columns exactly — this is the
    contract the future AI code review phase must fulfill."""

    architecture: dict
    folder_structure: dict
    problem_solving: dict
    code_quality: dict
    ai_usage: dict
    evidence: dict
    suggestions: list[str]
    confidence: float
    overall_score: float
    raw_report: dict


class CodeEvaluator:
    """Future phase: runs static analysis + AI review over a ParsedProject
    and produces an EvaluationReport."""

    def __init__(self, submission_id: str):
        self.submission_id = submission_id

    def run_static_analysis(self) -> dict:
        raise NotImplementedError("Wired up in the static analysis phase.")

    def run_ai_review(self) -> EvaluationReport:
        raise NotImplementedError("Wired up in the AI code review phase.")
