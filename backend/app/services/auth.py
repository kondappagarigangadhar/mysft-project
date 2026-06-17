from app.core.auth import create_access_token, create_refresh_token, verify_password, hash_password, decode_token
from app.core.exceptions import NotFoundError, ConflictError, ForbiddenError
from app.schemas.auth import TokenResponse, RegisterRequest
import asyncpg
import uuid


class AuthService:
    def __init__(self, db: asyncpg.Connection):
        self.db = db

    async def login(self, email: str, password: str) -> TokenResponse:
        row = await self.db.fetchrow("SELECT * FROM users WHERE email=$1 AND deleted_at IS NULL", email)
        if not row or not verify_password(password, row["password_hash"]):
            raise ForbiddenError("Invalid credentials")
        return TokenResponse(
            access_token=create_access_token({"sub": str(row["id"]), "org": str(row["organization_id"])}),
            refresh_token=create_refresh_token({"sub": str(row["id"])}),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        user_id = payload.get("sub")
        row = await self.db.fetchrow("SELECT * FROM users WHERE id=$1 AND deleted_at IS NULL", uuid.UUID(user_id))
        if not row:
            raise NotFoundError("User not found")
        return TokenResponse(
            access_token=create_access_token({"sub": str(row["id"]), "org": str(row["organization_id"])}),
            refresh_token=create_refresh_token({"sub": str(row["id"])}),
        )

    async def register(self, body: RegisterRequest):
        existing = await self.db.fetchrow("SELECT id FROM users WHERE email=$1", body.email)
        if existing:
            raise ConflictError("Email already registered")
        new_id = uuid.uuid4()
        await self.db.execute(
            "INSERT INTO users (id, email, password_hash, full_name, organization_id) VALUES ($1,$2,$3,$4,$5)",
            new_id, body.email, hash_password(body.password), body.full_name,
            uuid.UUID(body.organization_id) if body.organization_id else None,
        )
        return {"id": str(new_id), "email": body.email}

    async def logout(self, refresh_token: str):
        pass  # token blacklist can be implemented via Redis/DB if needed
