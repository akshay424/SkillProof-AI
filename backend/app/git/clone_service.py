from pathlib import Path


def clone_repository(gitlab_url: str) -> Path:
    """Future phase: shallow-clone the given GitLab repository into a temp
    working directory and return its path for the parser pipeline."""
    raise NotImplementedError("GitLab cloning is not implemented in this phase.")
