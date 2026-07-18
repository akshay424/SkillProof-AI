from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{report_id}/regenerate")
def regenerate_report(report_id: str, _=Depends(get_current_user)) -> dict:
    """Future phase: AI-generated evidence-based evaluation report."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Report generation is not implemented in this phase.",
    )
