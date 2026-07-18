from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import InvalidTokenError, decode_access_token
from app.database.supabase_client import get_supabase_admin_client
from app.schemas.auth import TokenPayload
from app.schemas.user import UserProfileOut

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> TokenPayload:
    try:
        return decode_access_token(credentials.credentials)
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


def get_current_user_profile(
    token: TokenPayload = Depends(get_current_user),
) -> UserProfileOut:
    supabase = get_supabase_admin_client()
    result = (
        supabase.table("user_profiles")
        .select("*")
        .eq("id", token.sub)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )
    return UserProfileOut(**result.data)


def require_role(*allowed_roles: str):
    def dependency(
        profile: UserProfileOut = Depends(get_current_user_profile),
    ) -> UserProfileOut:
        if profile.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(allowed_roles)}",
            )
        return profile

    return dependency
