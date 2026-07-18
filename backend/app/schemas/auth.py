from pydantic import BaseModel


class TokenPayload(BaseModel):
    sub: str
    email: str | None = None
    aud: str
    exp: int
    role: str | None = None
