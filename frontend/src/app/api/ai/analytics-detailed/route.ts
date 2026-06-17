import { NextResponse } from 'next/server';
import { MOCK_ANALYTICS_DETAILED_PAYLOAD, type AnalyticsDetailedPayload } from '@/lib/aiAnalytics.service';

function withFreshTimestamp(payload: AnalyticsDetailedPayload): AnalyticsDetailedPayload {
    return {
        ...payload,
        updatedAt: new Date().toISOString(),
    };
}

export async function GET() {
    const backend = process.env.AI_BACKEND_URL?.replace(/\/$/, '');

    if (backend) {
        try {
            const res = await fetch(`${backend}/api/ai/analytics-detailed`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(120_000),
            });
            const text = await res.text();
            let data: unknown = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                data = { message: text || 'Invalid JSON from AI backend' };
            }
            return NextResponse.json(data, { status: res.status });
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Proxy failed';
            return NextResponse.json({ message: msg, error: 'ai_proxy_error' }, { status: 502 });
        }
    }

    return NextResponse.json(withFreshTimestamp(MOCK_ANALYTICS_DETAILED_PAYLOAD));
}
