import time
import json
import logging
from uuid import UUID
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)

AUDIT_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
SKIP_AUDIT_PATHS = {"/api/v1/health", "/api/v1/auth/login", "/api/v1/auth/refresh"}


class TenantMiddleware(BaseHTTPMiddleware):
    """Injects organization_id from JWT claims into request.state."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request.state.organization_id = None
        request.state.user_id = None
        request.state.user_role = None

        token_data = getattr(request.state, "token_data", None)
        if token_data:
            request.state.organization_id = token_data.get("organization_id")
            request.state.user_id = token_data.get("sub")
            request.state.user_role = token_data.get("role")

        return await call_next(request)


class AuditMiddleware(BaseHTTPMiddleware):
    """Logs all mutating requests to audit_logs after response."""

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
                f"AUDIT | {request.method} {request.url.path} | "
                f"user={user_id} org={org_id} status={response.status_code} {duration_ms}ms"
            )
            # Full async DB write happens in the audit service called from route handlers
            # Middleware only logs; heavy audit diff is done at the service layer

        return response
