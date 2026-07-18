from app.database.supabase_client import get_supabase_admin_client


def load_prompt_template(key: str, organization_id: str) -> str | None:
    """Reads the active prompt_templates row for (organization_id, key).
    No AI call here — future phases interpolate variables and call an
    AIProvider with the returned template_body."""
    supabase = get_supabase_admin_client()
    result = (
        supabase.table("prompt_templates")
        .select("template_body")
        .eq("organization_id", organization_id)
        .eq("key", key)
        .eq("is_active", True)
        .maybe_single()
        .execute()
    )
    return result.data["template_body"] if result.data else None
