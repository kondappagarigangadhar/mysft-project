import uuid
import asyncpg

from app.core.auth import create_access_token, create_refresh_token, verify_password, hash_password, decode_token
from app.core.exceptions import NotFoundError, ConflictError, ForbiddenError
from app.schemas.auth import TokenResponse, RegisterRequest


class AuthService:
    def __init__(self, db: asyncpg.Connection):
        self.db = db

    async def login(self, email: str, password: str) -> TokenResponse:
        row = await self.db.fetchrow(
            "SELECT * FROM users WHERE email=$1 AND status != 'Inactive'", email,
        )
        if not row or not verify_password(password, row["password_hash"]):
            raise ForbiddenError("Invalid credentials")
        return TokenResponse(
            access_token=create_access_token({"sub": str(row["id"]), "org": str(row["organization_id"])}),
            refresh_token=create_refresh_token({"sub": str(row["id"])}),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ForbiddenError("Invalid token type")
        user_id = payload.get("sub")
        row = await self.db.fetchrow(
            "SELECT * FROM users WHERE id=$1 AND status != 'Inactive'", uuid.UUID(user_id),
        )
        if not row:
            raise NotFoundError("User")
        return TokenResponse(
            access_token=create_access_token({"sub": str(row["id"]), "org": str(row["organization_id"])}),
            refresh_token=create_refresh_token({"sub": str(row["id"])}),
        )

    async def register(self, body: RegisterRequest) -> dict:
        existing = await self.db.fetchrow("SELECT id FROM users WHERE email=$1", body.email)
        if existing:
            raise ConflictError("Email already registered")
        new_id = uuid.uuid4()
        org_id = uuid.UUID(body.organization_id) if body.organization_id else None
        await self.db.execute(
            """
            INSERT INTO users (id, organization_id, first_name, last_name, email, password_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            new_id, org_id, body.first_name, body.last_name, body.email, hash_password(body.password),
        )
        return {"id": str(new_id), "email": body.email, "first_name": body.first_name}

    async def logout(self, refresh_token: str) -> None:
        pass  # stateless JWT — token expiry handles invalidation
