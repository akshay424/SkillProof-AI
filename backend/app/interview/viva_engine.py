from dataclasses import dataclass


@dataclass
class VivaQuestion:
    question_text: str
    source_reference: dict


class VivaEngine:
    """Future phase: generates interview questions strictly from the
    submitted project's parsed code/evaluation report, and follow-up
    questions based on the employee's previous answers."""

    def __init__(self, submission_id: str):
        self.submission_id = submission_id

    def generate_opening_questions(self) -> list[VivaQuestion]:
        raise NotImplementedError("Wired up in the AI viva phase.")

    def generate_follow_up(self, previous_question: str, previous_answer: str) -> VivaQuestion:
        raise NotImplementedError("Wired up in the AI viva phase.")
