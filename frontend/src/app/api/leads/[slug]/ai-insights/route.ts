import { NextResponse } from 'next/server';
import { getLeadBySlug } from '@/lib/leadStore';
import { getLeadAIInsights, toApiInsightsPayload } from '@/lib/ai-sales-intelligence/aiInsightsRepository';
import { getDemoTenantId } from '@/lib/ai-sales-intelligence/aiSalesTenant';

/** GET /api/leads/{slug}/ai-insights — hybrid AI scoring output for a single lead. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const lead = getLeadBySlug(slug);
    if (!lead) {
        return NextResponse.json({ error: 'lead_not_found' }, { status: 404 });
    }

    const tenantId = getDemoTenantId();
    const record = getLeadAIInsights(slug, tenantId);
    if (!record) {
        return NextResponse.json({ error: 'ai_insights_unavailable' }, { status: 500 });
    }

    return NextResponse.json({ data: toApiInsightsPayload(record) });
}
