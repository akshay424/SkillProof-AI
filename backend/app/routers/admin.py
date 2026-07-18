from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.schemas.user import UserProfileOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping")
def admin_ping(
    profile: UserProfileOut = Depends(require_role("admin")),
) -> dict:
    return {
        "status": "ok",
        "checked_by": profile.id,
        "role": profile.role,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
