from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission

router = APIRouter()


class RecalculateLeadScoreBody(BaseModel):
    leadSlug: str | None = None
    leadId: str | None = None


@router.get("/lead-scores")
async def lead_scores(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("ai", "read")),
):
    return {"items": []}


@router.get("/demand-insights")
async def demand_insights(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("ai", "read")),
):
    return {"items": []}


@router.get("/leads/{lead_id}/ai-insights")
async def lead_ai_insights(
    lead_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("ai", "read")),
):
    """Hybrid AI insights for a lead — wire to LeadAIInsights + LeadFeatureStore tables."""
    row = await db.fetchrow(
        """
        SELECT lead_score, conversion_probability, lead_temperature, next_best_action,
               model_version, calculated_at
        FROM lead_ai_insights
        WHERE lead_id = $1 AND tenant_id = $2
        ORDER BY calculated_at DESC
        LIMIT 1
        """,
        lead_id,
        current_user.get("tenant_id"),
    )
    if not row:
        raise HTTPException(status_code=404, detail="ai_insights_not_found")
    return {
        "data": {
            "LeadScore": row["lead_score"],
            "ConversionProbability": row["conversion_probability"],
            "Temperature": row["lead_temperature"],
            "NextBestAction": row["next_best_action"],
            "ModelVersion": row["model_version"],
            "CalculatedAt": row["calculated_at"].isoformat() if row["calculated_at"] else None,
        }
    }


@router.post("/recalculate-lead-score")
async def recalculate_lead_score(
    body: RecalculateLeadScoreBody,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("ai", "write")),
):
    """Enqueue hybrid scoring pipeline — MVP returns accepted; worker updates LeadAIInsights."""
    slug = (body.leadSlug or body.leadId or "").strip()
    if not slug:
        raise HTTPException(status_code=400, detail="leadSlug_required")
    return {"data": {"status": "queued", "leadId": slug, "tenantId": current_user.get("tenant_id")}}


@router.get("/recommendations")
async def ai_recommendations(
    limit: int = 20,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("ai", "read")),
):
    """Prioritized next-best-action queue scoped by tenant."""
    limit = max(1, min(limit, 50))
    rows = await db.fetch(
        """
        SELECT lead_id, next_best_action, lead_score, conversion_probability, lead_temperature,
               calculated_at
        FROM lead_ai_insights
        WHERE tenant_id = $1
        ORDER BY lead_score DESC, conversion_probability DESC
        LIMIT $2
        """,
        current_user.get("tenant_id"),
        limit,
    )
    return {
        "data": {
            "items": [
                {
                    "leadId": r["lead_id"],
                    "nextBestAction": r["next_best_action"],
                    "leadScore": r["lead_score"],
                    "conversionProbability": r["conversion_probability"],
                    "temperature": r["lead_temperature"],
                }
                for r in rows
            ],
            "tenantId": current_user.get("tenant_id"),
        }
    }
