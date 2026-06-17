import { NextRequest, NextResponse } from 'next/server';
import { getAllLeadAIInsights } from '@/lib/ai-sales-intelligence/aiInsightsRepository';
import { getDemoTenantId } from '@/lib/ai-sales-intelligence/aiSalesTenant';

/** GET /api/ai/recommendations — prioritized AI action queue for sales desk. */
export async function GET(req: NextRequest) {
    const tenantId = getDemoTenantId();
    const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 20)));

    const rows = getAllLeadAIInsights(tenantId)
        .sort((a, b) => {
            const prio = { Critical: 0, High: 1, Medium: 2, Low: 3 };
            return prio[a.queuePriority] - prio[b.queuePriority] || b.confidenceScore - a.confidenceScore;
        })
        .slice(0, limit)
        .map((r) => ({
            leadId: r.leadId,
            leadName: r.leadName,
            recommendation: r.queueRecommendation,
            nextBestAction: r.nextBestAction,
            priority: r.queuePriority,
            confidence: r.confidenceScore,
            expectedOutcome: r.queueExpectedOutcome,
            leadScore: r.leadScore,
            conversionProbability: r.conversionProbability,
            temperature: r.leadTemperature,
        }));

    return NextResponse.json({ data: { items: rows, tenantId } });
}
