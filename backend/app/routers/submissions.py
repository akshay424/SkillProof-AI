from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("")
def create_submission(_=Depends(get_current_user)) -> dict:
    """Future phase: accept GitLab URL or ZIP upload, clone/extract, detect
    project type, parse, run static analysis, run AI review, generate report."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Submission processing is not implemented in this phase.",
    )
