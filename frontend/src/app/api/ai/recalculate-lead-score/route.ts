import { NextRequest, NextResponse } from 'next/server';
import { getLeadBySlug } from '@/lib/leadStore';
import { recalculateLeadAIInsights, toApiInsightsPayload } from '@/lib/ai-sales-intelligence/aiInsightsRepository';
import { getDemoTenantId } from '@/lib/ai-sales-intelligence/aiSalesTenant';

/** POST /api/ai/recalculate-lead-score — force hybrid AI pipeline rerun for one lead. */
export async function POST(req: NextRequest) {
    let body: { leadSlug?: string; leadId?: string } = {};
    try {
        body = (await req.json()) as typeof body;
    } catch {
        body = {};
    }

    const slug = (body.leadSlug ?? body.leadId ?? '').trim();
    if (!slug) {
        return NextResponse.json({ error: 'leadSlug_required' }, { status: 400 });
    }

    const lead = getLeadBySlug(slug);
    if (!lead) {
        return NextResponse.json({ error: 'lead_not_found' }, { status: 404 });
    }

    const tenantId = getDemoTenantId();
    const record = recalculateLeadAIInsights(slug, tenantId);
    if (!record) {
        return NextResponse.json({ error: 'recalculate_failed' }, { status: 500 });
    }

    return NextResponse.json({ data: toApiInsightsPayload(record) });
}
