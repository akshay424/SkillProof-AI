from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ParsedProject:
    project_type: str  # flutter | react | node | python | java | android | ios
    detected_patterns: list[str]
    file_summary: dict
    dependency_graph: dict


class BaseParser(ABC):
    """Future phase: one subclass per supported stack (Flutter/React/Node/
    Python/Java/Android/iOS). Foundation phase only defines the contract."""

    @abstractmethod
    def detect_project_type(self, root: Path) -> bool:
        raise NotImplementedError

    @abstractmethod
    def parse(self, root: Path) -> ParsedProject:
        raise NotImplementedError
