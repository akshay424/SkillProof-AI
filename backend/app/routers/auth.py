from fastapi import APIRouter, Depends

from app.core.deps import get_current_user_profile
from app.schemas.user import UserProfileOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserProfileOut)
def read_current_user(
    profile: UserProfileOut = Depends(get_current_user_profile),
) -> UserProfileOut:
    """Proves the Supabase-issued JWT is verified end-to-end by the backend."""
    return profile
