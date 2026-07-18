from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/generate")
def generate_task(_=Depends(get_current_user)) -> dict:
    """Future phase: AI-generated practical coding task for a roadmap week."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Task generation is not implemented in this phase.",
    )
