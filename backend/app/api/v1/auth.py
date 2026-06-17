from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import asyncpg
from app.db.session import get_db
from app.services.auth import AuthService
from app.schemas.auth import TokenResponse, RefreshRequest, RegisterRequest

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: asyncpg.Connection = Depends(get_db)):
    return await AuthService(db).login(form.username, form.password)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: asyncpg.Connection = Depends(get_db)):
    return await AuthService(db).refresh(body.refresh_token)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: asyncpg.Connection = Depends(get_db)):
    return await AuthService(db).register(body)


@router.post("/logout")
async def logout(body: RefreshRequest, db: asyncpg.Connection = Depends(get_db)):
    await AuthService(db).logout(body.refresh_token)
    return {"detail": "logged out"}
