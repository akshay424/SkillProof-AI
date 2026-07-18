from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/start")
def start_viva(_=Depends(get_current_user)) -> dict:
    """Future phase: real-time AI viva interview, questions generated only
    from the employee's submitted code, with AI-generated follow-ups."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AI viva interview is not implemented in this phase.",
    )
