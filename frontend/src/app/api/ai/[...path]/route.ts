import { NextRequest, NextResponse } from 'next/server';

/**
 * AI API catch-all: POST /api/ai/<...path>
 *
 * - If `AI_BACKEND_URL` is set (e.g. https://api.yoursite.com), requests are proxied to
 *   `${AI_BACKEND_URL}/api/ai/<path>` with the same JSON body.
 * - Otherwise returns demo JSON so the CRM UI works without a real AI service (no 404).
 */

function demoResponse(pathKey: string, body: Record<string, unknown>) {
    switch (pathKey) {
        case 'lead-score':
            return {
                insight: 'Buying signals look strong based on budget range and stated timeline.',
                conversionProbability: 78,
                confidence: 86,
                action: 'Book a site visit within 48 hours.',
            };
        case 'lead-copilot':
            return {
                nextAction: 'Schedule a call to confirm financing timeline.',
                bestTimeToContact: 'Tue–Thu, 10:00–12:00 IST',
                suggestedPitch: 'Lead with inventory fit, then anchor on flexible milestone options.',
                confidence: 84,
            };
        case 'buyer-copilot':
            return {
                paymentRisk: body.pendingRatio && Number(body.pendingRatio) > 0.5 ? 'High' : 'Medium',
                engagementScore: 72,
                paymentRecommendation: 'Send payment link for the next milestone installment.',
                overdueAlert: body.paymentStatus === 'Overdue',
                pendingDocuments: 1,
                upsell: 'Club membership bundle before possession handover.',
                confidence: 81,
            };
        case 'improve-conversion':
            return {
                insight: 'Add a time-bound incentive (e.g. parking or club) to increase urgency.',
                confidence: 79,
                action: 'Send a 60s Loom walkthrough of the sample unit.',
            };
        case 'lead-suggestion':
            return {
                nextBestAction: 'Follow-up',
                conversionProbability: Math.min(95, 40 + Math.round(Math.random() * 40)),
                summary: 'Demo response — connect AI_BACKEND_URL for live AI.',
            };
        case 'payment-insights': {
            const delayRiskHigh = body.simulateDelay === true || Math.random() > 0.75;
            return {
                riskLabel: delayRiskHigh ? 'High' : 'Medium',
                riskScore: delayRiskHigh ? 'High' : 'Medium',
                delayDays: delayRiskHigh ? 5 : 0,
                delayPrediction: delayRiskHigh
                    ? 'Elevated chance of slip beyond due window (demo).'
                    : 'No delay expected in the next 14 days (demo).',
                recoveryStrategy: delayRiskHigh
                    ? 'Offer split payment + confirm date on call within 24h.'
                    : 'Send a polite reminder 3 days before the next due date.',
                recommendation: 'Keep receipt trail updated in the ledger.',
                confidence: delayRiskHigh ? 76 : 88,
                delayRiskHigh,
            };
        }
        case 'payment-reminder':
            return {
                message:
                    'Hi, this is a friendly reminder about your upcoming payment. Please let us know if you need help with the schedule. — Demo message',
                messages: {
                    soft: 'Hi! Just a gentle nudge on your upcoming installment — happy to help if dates need tweaking.',
                    professional:
                        'Dear customer, this is a courtesy reminder regarding your scheduled payment per the agreement. Please contact us for any clarifications.',
                    strict:
                        'Important: Your payment is overdue. Please remit immediately to avoid penalties and booking implications as per terms.',
                },
            };
        case 'executive-summary':
            return {
                headline: 'This week’s pulse',
                riskPayments: 3,
                hotLeads: 8,
                urgentActions: 4,
                bullets: [
                    '₹2.1Cr in installments flagged as watchlist.',
                    '5 hot leads without a logged follow-up in 7 days.',
                    '2 compliance docs expiring in 30 days.',
                ],
                confidence: 88,
            };
        case 'notification-suggest':
            return {
                bestTimeToSend: 'Tue or Thu, 10:30–11:30 IST',
                bestChannel: 'WhatsApp + Email',
                confidence: 82,
            };
        case 'project-update':
            return {
                update:
                    'Project status: on track for the current phase. Inventory and pricing tabs have the latest numbers. (Demo — connect AI_BACKEND_URL for live updates.)',
            };
        case 'extract':
            return {
                data: {
                    document: (body.documentName as string) || 'Document',
                    note: 'Demo extracted fields — wire AI_BACKEND_URL for real extraction.',
                },
            };
        case 'explain':
            return {
                explanation:
                    'Demo clause summary: key terms include payment milestones, possession timeline, and penalty clauses. Review with legal for binding interpretation.',
                importantClauses: ['Payment schedule & late fees', 'Possession / handover conditions'],
            };
        case 'risk':
            return {
                risks: [
                    'Demo risk: verify all annexures are countersigned.',
                    'Demo risk: check RERA registration references match the brochure.',
                ],
            };
        case 'compliance-check':
            return {
                missingDocuments: ['KYC update (demo)', 'Latest NOC copy'],
                expiringSoon: ['Insurance certificate — 45 days'],
            };
        case 'analytics':
            return {
                summary:
                    'Demo analytics: focus on overdue installments and leads without contact in 7+ days. Connect your data API for real metrics.',
                insights: [
                    'Top concern: payment delays on milestone-linked plans.',
                    'Opportunity: leads marked Warm with no site visit scheduled.',
                ],
            };
        case 'notification':
            return {
                message:
                    'Demo notification: Your payment is due soon. Tap here to view details. Reply STOP to opt out. — Set AI_BACKEND_URL for production copy.',
            };
        default:
            return {
                message: `Unknown AI path "${pathKey}" (demo fallback).`,
                error: 'unknown_path',
            };
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path: segments } = await params;
    const pathKey = segments.join('/');

    let body: Record<string, unknown> = {};
    try {
        body = (await req.json()) as Record<string, unknown>;
    } catch {
        body = {};
    }

    const backend = process.env.AI_BACKEND_URL?.replace(/\/$/, '');

    if (backend) {
        const url = `${backend}/api/ai/${pathKey}`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
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

    const data = demoResponse(pathKey, body);
    return NextResponse.json(data);
}
