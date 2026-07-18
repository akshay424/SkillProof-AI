from jose import JWTError, jwt

from app.config import get_settings
from app.schemas.auth import TokenPayload

ALGORITHM = "HS256"
EXPECTED_AUDIENCE = "authenticated"


class InvalidTokenError(Exception):
    pass


def decode_access_token(token: str) -> TokenPayload:
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        raise InvalidTokenError("SUPABASE_JWT_SECRET is not configured")

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=[ALGORITHM],
            audience=EXPECTED_AUDIENCE,
        )
    except JWTError as exc:
        raise InvalidTokenError(str(exc)) from exc

    return TokenPayload(**payload)
