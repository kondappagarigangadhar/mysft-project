import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from jose import JWTError, jwt

from app.core.config import settings

logger = logging.getLogger(__name__)

AUDIT_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
SKIP_AUDIT_PATHS = {"/api/v1/health", "/api/v1/auth/login", "/api/v1/auth/refresh"}


class TenantMiddleware(BaseHTTPMiddleware):
    """Parses JWT from Authorization header and injects org/user context into request.state."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request.state.organization_id = None
        request.state.user_id = None
        request.state.user_role = None

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer "):]
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                request.state.user_id = payload.get("sub")
                request.state.organization_id = payload.get("org")
                request.state.user_role = payload.get("role")
            except JWTError:
                pass  # Invalid token — let the route dependency reject it with 401

        return await call_next(request)


class AuditMiddleware(BaseHTTPMiddleware):
    """Logs all mutating requests to stdout after response. DB audit write happens in service layer."""

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.time()
        response = await call_next(request)
        duration_ms = int((time.time() - start) * 1000)

        if (
            request.method in AUDIT_METHODS
            and request.url.path not in SKIP_AUDIT_PATHS
            and response.status_code < 400
        ):
            user_id = getattr(request.state, "user_id", None)
            org_id = getattr(request.state, "organization_id", None)
            logger.info(
                "AUDIT | %s %s | user=%s org=%s status=%s %dms",
                request.method, request.url.path, user_id, org_id,
                response.status_code, duration_ms,
            )

        return response
