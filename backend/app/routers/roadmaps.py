from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user

router = APIRouter(prefix="/roadmaps", tags=["roadmaps"])


@router.post("/generate")
def generate_roadmap(_=Depends(get_current_user)) -> dict:
    """Future phase: AI diagnostic -> competency graph -> personalized 8-week roadmap."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Roadmap generation is not implemented in this phase.",
    )
