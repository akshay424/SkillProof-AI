from app.database.supabase_client import get_supabase_admin_client
from app.schemas.user import UserProfileOut


def get_profile_by_id(user_id: str) -> UserProfileOut | None:
    supabase = get_supabase_admin_client()
    result = (
        supabase.table("user_profiles")
        .select("*")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    return UserProfileOut(**result.data) if result.data else None
