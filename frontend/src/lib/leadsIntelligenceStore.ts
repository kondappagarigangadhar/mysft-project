'use client';

import { getLeadBySlugIncludingArchived, slugify, updateLead } from '@/lib/leadStore';

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
export type LeadSource = 'Website' | 'Referral' | 'Campaign' | 'Ads';
export type LeadTemperature = 'Hot' | 'Warm' | 'Cold';
export type FollowUpRisk = 'Low' | 'Medium' | 'High';

/** API-ready next-step hint for sales desk / smart table. */
export type IntelligenceNextAction = 'Call' | 'Visit' | 'Offer';

export interface LeadActivity {
    id: string;
    type: 'Call' | 'Email' | 'Meeting';
    date: string;
    note: string;
}

export interface IntelligenceLead {
    id: string;
    /** Same as `Lead.slug` in `leadStore` — canonical key for `/leads/view/[slug]` */
    leadSlug: string;
    name: string;
    phone: string;
    email: string;
    source: LeadSource;
    leadScore: number;
    conversionProbability: number;
    temperature: LeadTemperature;
    engagementScore: number;
    nextBestAction: string;
    followUpRisk: FollowUpRisk;
    status: LeadStatus;
    assignedTo: string;
    notes: string;
    /** Full present address (house no., street, city, state, PIN). */
    presentAddress: string;
    /** Full permanent address when different from present. */
    permanentAddress: string;
    createdAt: string;
    activity: LeadActivity[];
    /** Project / inventory focus for filters and routing. */
    projectInterest: string;
    /** Recommended sales action for smart table. */
    nextAction: IntelligenceNextAction;
    /** Human-readable best outreach window (mock / future: from AI scheduling). */
    bestCallTimeLabel: string;
    /** Model suggests prioritizing a site visit. */
    visitRecommendation: boolean;
}

/** Seeded to match names + slugs from `mockData.leads` / `leadStore` (single CRM identity). */
const seedLeads: IntelligenceLead[] = [
    {
        id: 'lead-1001',
        leadSlug: 'ramesh-kumar',
        name: 'Ramesh Kumar',
        phone: '9876543210',
        email: 'ramesh@gmail.com',
        source: 'Website',
        leadScore: 91,
        conversionProbability: 83,
        temperature: 'Hot',
        engagementScore: 88,
        nextBestAction: 'Call today and share payment plan',
        followUpRisk: 'Low',
        status: 'Qualified',
        assignedTo: 'Amit Sales',
        notes: 'Prefers east-facing flat with park view.',
        presentAddress: 'Flat 402, Skyline Apartments, Road No. 12, Banjara Hills, Hyderabad, Telangana 500034',
        permanentAddress: 'H.No. 18-4-87/2, Malkajgiri, Secunderabad, Telangana 500047',
        createdAt: '2026-02-15',
        activity: [
            { id: 'a1', type: 'Call', date: '2026-03-16', note: 'Discussed budget and EMI flexibility.' },
            { id: 'a2', type: 'Meeting', date: '2026-03-18', note: 'Walked through unit options.' },
        ],
        projectInterest: 'Skyline Residency',
        nextAction: 'Visit',
        bestCallTimeLabel: 'Today 6–8 PM',
        visitRecommendation: true,
    },
    {
        id: 'lead-1002',
        leadSlug: 'anita-sharma',
        name: 'Anita Sharma',
        phone: '9845012345',
        email: 'anita.sharma@yahoo.com',
        source: 'Ads',
        leadScore: 74,
        conversionProbability: 71,
        temperature: 'Warm',
        engagementScore: 70,
        nextBestAction: 'Follow-up on pending legal query',
        followUpRisk: 'High',
        status: 'Contacted',
        assignedTo: 'Priya Reddy',
        notes: 'Looking for quick move-in within 3 months.',
        presentAddress: 'B-704, Green Valley Residency, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
        permanentAddress: 'Same as present address',
        createdAt: '2026-03-01',
        activity: [{ id: 'a3', type: 'Email', date: '2026-03-19', note: 'Shared brochure and legal summary.' }],
        projectInterest: 'Green Valley Phase 2',
        nextAction: 'Call',
        bestCallTimeLabel: 'Tomorrow 11 AM',
        visitRecommendation: false,
    },
    {
        id: 'lead-1003',
        leadSlug: 'suresh-raina',
        name: 'Suresh Raina',
        phone: '9122334455',
        email: 'suresh.raina@gmail.com',
        source: 'Ads',
        leadScore: 86,
        conversionProbability: 78,
        temperature: 'Hot',
        engagementScore: 82,
        nextBestAction: 'Schedule final negotiation meeting',
        followUpRisk: 'Medium',
        status: 'Qualified',
        assignedTo: 'Vikram Singh',
        notes: 'Joint family; needs parking for 3 cars.',
        presentAddress: 'Villa 7, Summit Woods Phase 1, Sarjapur Road, Bengaluru, Karnataka 562125',
        permanentAddress: 'Plot 22, Sector 4, Rohtak Road, Sonipat, Haryana 131001',
        createdAt: '2026-03-05',
        activity: [{ id: 'a4', type: 'Call', date: '2026-03-18', note: 'Discussed preferred floor and view.' }],
        projectInterest: 'Summit Woods',
        nextAction: 'Offer',
        bestCallTimeLabel: 'Today 4–6 PM',
        visitRecommendation: true,
    },
    {
        id: 'lead-1004',
        leadSlug: 'meena-iyer',
        name: 'Meena Iyer',
        phone: '9222334455',
        email: 'meena.iyer@outlook.com',
        source: 'Referral',
        leadScore: 84,
        conversionProbability: 76,
        temperature: 'Hot',
        engagementScore: 79,
        nextBestAction: 'Send price comparison sheet',
        followUpRisk: 'Medium',
        status: 'Qualified',
        assignedTo: 'Amit Sales',
        notes: 'Referred by existing customer; strong interest in Tower C.',
        presentAddress: '12-C, Alwarpet Street, Near Luz Church, Chennai, Tamil Nadu 600018',
        permanentAddress: 'Door 56, Kaveri Nagar, Madurai, Tamil Nadu 625020',
        createdAt: '2026-03-08',
        activity: [{ id: 'a5', type: 'Email', date: '2026-03-21', note: 'Sent intro deck and sample inventory.' }],
        projectInterest: 'Skyline Residency',
        nextAction: 'Visit',
        bestCallTimeLabel: 'Tomorrow 5–7 PM',
        visitRecommendation: true,
    },
    {
        id: 'lead-1005',
        leadSlug: 'vikram-kapoor',
        name: 'Vikram Kapoor',
        phone: '9333445566',
        email: 'vikram.kapoor@gmail.com',
        source: 'Website',
        leadScore: 54,
        conversionProbability: 38,
        temperature: 'Cold',
        engagementScore: 48,
        nextBestAction: 'Re-engage with financing offers',
        followUpRisk: 'High',
        status: 'Contacted',
        assignedTo: 'Sneha Reddy',
        notes: 'No response for several days after first call.',
        presentAddress: '903, Oberoi Springs, Andheri West, Mumbai, Maharashtra 400053',
        permanentAddress: '903, Oberoi Springs, Andheri West, Mumbai, Maharashtra 400053',
        createdAt: '2026-03-10',
        activity: [{ id: 'a6', type: 'Call', date: '2026-03-11', note: 'Left voicemail, no callback.' }],
        projectInterest: 'Metro Heights',
        nextAction: 'Call',
        bestCallTimeLabel: '—',
        visitRecommendation: false,
    },
    {
        id: 'lead-1006',
        leadSlug: 'pallavi-joshi',
        name: 'Pallavi Joshi',
        phone: '9444556677',
        email: 'pallavi.joshi@gmail.com',
        source: 'Referral',
        leadScore: 90,
        conversionProbability: 88,
        temperature: 'Hot',
        engagementScore: 86,
        nextBestAction: 'Close with limited-time pricing',
        followUpRisk: 'Low',
        status: 'Converted',
        assignedTo: 'Rajesh Kumar',
        notes: 'Commercial booking completed.',
        presentAddress: 'Shop Unit 14, Ground Floor, Phoenix MarketCity, Velachery, Chennai, Tamil Nadu 600042',
        permanentAddress: '15, 2nd Main Road, T. Nagar, Chennai, Tamil Nadu 600017',
        createdAt: '2026-03-11',
        activity: [{ id: 'a7', type: 'Meeting', date: '2026-03-09', note: 'Signed booking form.' }],
        projectInterest: 'Phoenix MarketCity Retail',
        nextAction: 'Offer',
        bestCallTimeLabel: 'Today 2–4 PM',
        visitRecommendation: false,
    },
    {
        id: 'lead-1007',
        leadSlug: 'arjun-verma',
        name: 'Arjun Verma',
        phone: '9555667788',
        email: 'arjun.verma@gmail.com',
        source: 'Website',
        leadScore: 88,
        conversionProbability: 81,
        temperature: 'Hot',
        engagementScore: 85,
        nextBestAction: 'Collect pending token — ₹5L due this week',
        followUpRisk: 'Medium',
        status: 'Qualified',
        assignedTo: 'Amit Sales',
        notes: 'Payment status: Token pending. Customer agreed; awaiting bank transfer.',
        presentAddress: 'Flat 12B, Lakeview Towers, Hitech City, Hyderabad, Telangana 500081',
        permanentAddress: 'Same as present address',
        createdAt: '2026-02-28',
        activity: [
            { id: 'a8', type: 'Call', date: '2026-03-20', note: 'Confirmed unit 1204 — token pending.' },
            { id: 'a9', type: 'Email', date: '2026-03-22', note: 'Sent payment link for token amount.' },
        ],
        projectInterest: 'Green Valley Phase 2',
        nextAction: 'Offer',
        bestCallTimeLabel: 'Today 11 AM–1 PM',
        visitRecommendation: false,
    },
    {
        id: 'lead-1008',
        leadSlug: 'sneha-kapoor',
        name: 'Sneha Kapoor',
        phone: '9666778899',
        email: 'sneha.kapoor@outlook.com',
        source: 'Campaign',
        leadScore: 72,
        conversionProbability: 64,
        temperature: 'Warm',
        engagementScore: 68,
        nextBestAction: 'Resolve pending documentation before offer',
        followUpRisk: 'High',
        status: 'Contacted',
        assignedTo: 'Priya Reddy',
        notes: 'Payment status: Booking amount pending — legal vetting in progress.',
        presentAddress: '501, Palm Grove, Sector 45, Gurgaon, Haryana 122003',
        permanentAddress: '12, Civil Lines, Jaipur, Rajasthan 302006',
        createdAt: '2026-03-02',
        activity: [{ id: 'a10', type: 'Email', date: '2026-03-14', note: 'Shared draft sale agreement.' }],
        projectInterest: 'Metro Heights',
        nextAction: 'Call',
        bestCallTimeLabel: 'Tomorrow 10 AM',
        visitRecommendation: false,
    },
    {
        id: 'lead-1009',
        leadSlug: 'deepak-nair',
        name: 'Deepak Nair',
        phone: '9777889900',
        email: 'deepak.nair@yahoo.com',
        source: 'Ads',
        leadScore: 42,
        conversionProbability: 28,
        temperature: 'Cold',
        engagementScore: 35,
        nextBestAction: 'Suspected low intent — qualify budget before investing time',
        followUpRisk: 'High',
        status: 'New',
        assignedTo: 'Sneha Reddy',
        notes: 'EOI ₹1L received on Unit 508; ₹2L token pending — qualify intent before site visit.',
        presentAddress: '44, MG Road, Kochi, Kerala 682001',
        permanentAddress: '44, MG Road, Kochi, Kerala 682001',
        createdAt: '2026-03-18',
        activity: [],
        projectInterest: 'Skyline Residency',
        nextAction: 'Call',
        bestCallTimeLabel: '—',
        visitRecommendation: false,
    },
    {
        id: 'lead-1010',
        leadSlug: 'kavita-menon',
        name: 'Kavita Menon',
        phone: '9888990011',
        email: 'kavita.menon@gmail.com',
        source: 'Referral',
        leadScore: 89,
        conversionProbability: 84,
        temperature: 'Hot',
        engagementScore: 87,
        nextBestAction: 'Close pending balance after site visit',
        followUpRisk: 'Low',
        status: 'Qualified',
        assignedTo: 'Vikram Singh',
        notes: 'Payment status: 20% paid; balance ₹42L pending before registration.',
        presentAddress: 'Villa 3, Summit Woods Phase 2, Sarjapur, Bengaluru, Karnataka 562125',
        permanentAddress: 'Door 8, Panampilly Nagar, Kochi, Kerala 682036',
        createdAt: '2026-03-06',
        activity: [
            { id: 'a11', type: 'Meeting', date: '2026-03-19', note: 'Site visit completed — loved east villa.' },
            { id: 'a12', type: 'Call', date: '2026-03-23', note: 'Discussed payment schedule for balance.' },
        ],
        projectInterest: 'Summit Woods',
        nextAction: 'Offer',
        bestCallTimeLabel: 'Today 3–5 PM',
        visitRecommendation: true,
    },
    {
        id: 'lead-1011',
        leadSlug: 'rahul-desai',
        name: 'Rahul Desai',
        phone: '9900112233',
        email: 'rahul.desai@gmail.com',
        source: 'Website',
        leadScore: 92,
        conversionProbability: 95,
        temperature: 'Hot',
        engagementScore: 90,
        nextBestAction: 'Payment received — schedule handover',
        followUpRisk: 'Low',
        status: 'Converted',
        assignedTo: 'Rajesh Kumar',
        notes: 'Payment status: Paid in full — ₹1.12Cr received. Booking confirmed Tower B.',
        presentAddress: '902, Skyline Residency Tower B, Banjara Hills, Hyderabad, Telangana 500034',
        permanentAddress: '902, Skyline Residency Tower B, Banjara Hills, Hyderabad, Telangana 500034',
        createdAt: '2026-02-20',
        activity: [
            { id: 'a13', type: 'Meeting', date: '2026-03-08', note: 'Signed sale deed.' },
            { id: 'a14', type: 'Call', date: '2026-03-15', note: 'Full payment cleared — welcome kit sent.' },
        ],
        projectInterest: 'Skyline Residency',
        nextAction: 'Offer',
        bestCallTimeLabel: 'Today 2–4 PM',
        visitRecommendation: false,
    },
    {
        id: 'lead-1012',
        leadSlug: 'lakshi-reddy',
        name: 'Lakshi Reddy',
        phone: '9011223344',
        email: 'lakshmi.reddy@gmail.com',
        source: 'Campaign',
        leadScore: 58,
        conversionProbability: 22,
        temperature: 'Cold',
        engagementScore: 40,
        nextBestAction: 'Suspected lost to competitor — last attempt nurture',
        followUpRisk: 'High',
        status: 'Lost',
        assignedTo: 'Priya Reddy',
        notes: 'Suspected category: Chose competitor project — payment talks stalled.',
        presentAddress: '15-2-468, Himayatnagar, Hyderabad, Telangana 500029',
        permanentAddress: '15-2-468, Himayatnagar, Hyderabad, Telangana 500029',
        createdAt: '2026-02-10',
        activity: [{ id: 'a15', type: 'Call', date: '2026-02-25', note: 'Customer cited lower quote elsewhere.' }],
        projectInterest: 'Green Valley Phase 2',
        nextAction: 'Call',
        bestCallTimeLabel: '—',
        visitRecommendation: false,
    },
    {
        id: 'lead-1013',
        leadSlug: 'rohit-khanna',
        name: 'Rohit Khanna',
        phone: '9122334456',
        email: 'rohit.khanna@gmail.com',
        source: 'Ads',
        leadScore: 67,
        conversionProbability: 52,
        temperature: 'Warm',
        engagementScore: 58,
        nextBestAction: 'Follow up on pending home loan sanction',
        followUpRisk: 'High',
        status: 'Contacted',
        assignedTo: 'Vikram Singh',
        notes: 'Booking Unit 804: ₹15L token paid; ₹50K loan processing fee pending — bank sanction in progress.',
        presentAddress: '204, Orion Heights, Noida Sector 62, Uttar Pradesh 201309',
        permanentAddress: '204, Orion Heights, Noida Sector 62, Uttar Pradesh 201309',
        createdAt: '2026-03-12',
        activity: [{ id: 'a16', type: 'Call', date: '2026-03-17', note: 'Bank visit scheduled for sanction letter.' }],
        projectInterest: 'Metro Heights',
        nextAction: 'Call',
        bestCallTimeLabel: 'Tomorrow 4 PM',
        visitRecommendation: true,
    },
    {
        id: 'lead-1014',
        leadSlug: 'nisha-patel',
        name: 'Nisha Patel',
        phone: '9233445567',
        email: 'nisha.patel@gmail.com',
        source: 'Referral',
        leadScore: 81,
        conversionProbability: 74,
        temperature: 'Warm',
        engagementScore: 76,
        nextBestAction: 'Send formal offer — visit done, payment plan pending',
        followUpRisk: 'Medium',
        status: 'Qualified',
        assignedTo: 'Amit Sales',
        notes: 'Payment status: Offer pending acceptance — ₹15L token on signing.',
        presentAddress: 'B-302, Riverfront Residency, Ahmedabad, Gujarat 380054',
        permanentAddress: '22, Ashram Road, Ahmedabad, Gujarat 380009',
        createdAt: '2026-03-09',
        activity: [
            { id: 'a17', type: 'Meeting', date: '2026-03-21', note: 'Second site visit with spouse.' },
            { id: 'a18', type: 'Email', date: '2026-03-24', note: 'Offer draft sent — awaiting signature.' },
        ],
        projectInterest: 'Phoenix MarketCity Retail',
        nextAction: 'Visit',
        bestCallTimeLabel: 'Today 5–7 PM',
        visitRecommendation: true,
    },
    {
        id: 'lead-1015',
        leadSlug: 'karan-mehta',
        name: 'Karan Mehta',
        phone: '9344556678',
        email: 'karan.mehta@yahoo.com',
        source: 'Website',
        leadScore: 48,
        conversionProbability: 32,
        temperature: 'Cold',
        engagementScore: 44,
        nextBestAction: 'Suspected budget mismatch — confirm ₹ range',
        followUpRisk: 'Medium',
        status: 'New',
        assignedTo: 'Sneha Reddy',
        notes: 'Alternate Unit 512 (₹48L) held — ₹3L token pending; pricing sheet shared for budget fit.',
        presentAddress: '78, Satellite Road, Ahmedabad, Gujarat 380015',
        permanentAddress: '78, Satellite Road, Ahmedabad, Gujarat 380015',
        createdAt: '2026-03-20',
        activity: [{ id: 'a19', type: 'Call', date: '2026-03-22', note: 'Initial call — budget ₹45L vs ₹65L ask.' }],
        projectInterest: 'Metro Heights',
        nextAction: 'Call',
        bestCallTimeLabel: 'Tomorrow 2 PM',
        visitRecommendation: false,
    },
];

let leadsData: IntelligenceLead[] = [...seedLeads];

const idFromNow = () => `lead-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;

function normalizeIntelligenceLead(lead: IntelligenceLead): IntelligenceLead {
    const nextAction: IntelligenceNextAction =
        lead.nextAction === 'Call' || lead.nextAction === 'Visit' || lead.nextAction === 'Offer' ? lead.nextAction : 'Call';
    return {
        ...lead,
        presentAddress: lead.presentAddress ?? '',
        permanentAddress: lead.permanentAddress ?? '',
        projectInterest: (lead.projectInterest ?? '').trim() || '—',
        nextAction,
        bestCallTimeLabel: (lead.bestCallTimeLabel ?? '').trim() || '—',
        visitRecommendation: Boolean(lead.visitRecommendation),
    };
}

export function getIntelligenceLeads() {
    return leadsData.map(normalizeIntelligenceLead);
}

export function getIntelligenceLeadById(id: string) {
    const lead = leadsData.find((l) => l.id === id);
    return lead ? normalizeIntelligenceLead(lead) : undefined;
}

/** Match by CRM `Lead.slug` / `/leads/view/[slug]`. */
export function getIntelligenceLeadByLeadSlug(leadSlug: string) {
    const key = leadSlug.trim();
    if (!key) return undefined;
    const row = leadsData.find((l) => l.leadSlug === key);
    return row ? normalizeIntelligenceLead(row) : undefined;
}

/** Keep main CRM lead addresses in sync when intelligence rows change. */
function pushIntelligenceAddressesToCrm(leadSlug: string, presentAddress: string, permanentAddress: string) {
    if (!getLeadBySlugIncludingArchived(leadSlug)) return;
    updateLead(leadSlug, { presentAddress, permanentAddress });
}

export function addIntelligenceLead(
    payload: Omit<
        IntelligenceLead,
        | 'id'
        | 'createdAt'
        | 'activity'
        | 'leadScore'
        | 'conversionProbability'
        | 'temperature'
        | 'engagementScore'
        | 'followUpRisk'
        | 'nextBestAction'
        | 'leadSlug'
        | 'projectInterest'
        | 'nextAction'
        | 'bestCallTimeLabel'
        | 'visitRecommendation'
    >
) {
    const leadScore = Math.floor(50 + Math.random() * 45);
    const conversionProbability = Math.min(95, Math.max(18, leadScore - 8));
    const engagementScore = Math.min(99, Math.max(20, leadScore - 5));
    const followUpRisk: FollowUpRisk = conversionProbability > 70 ? 'Low' : conversionProbability > 45 ? 'Medium' : 'High';
    const temperature: LeadTemperature = leadScore >= 80 ? 'Hot' : leadScore >= 60 ? 'Warm' : 'Cold';
    const nextBestAction =
        temperature === 'Hot'
            ? 'Prioritize direct call and offer tailored discount'
            : temperature === 'Warm'
              ? 'Schedule follow-up demo with financing options'
              : 'Start nurture sequence with value content';

    const leadSlug = slugify(payload.name.trim()) || `intelligence-${Date.now()}`;

    const inferredNextAction: IntelligenceNextAction =
        temperature === 'Hot' && leadScore >= 82 ? 'Visit' : leadScore >= 72 ? 'Offer' : 'Call';
    const nextLead: IntelligenceLead = {
        ...payload,
        presentAddress: payload.presentAddress?.trim() ?? '',
        permanentAddress: payload.permanentAddress?.trim() ?? '',
        id: idFromNow(),
        leadSlug,
        createdAt: new Date().toISOString().slice(0, 10),
        activity: [{ id: `act-${Date.now()}`, type: 'Call', date: new Date().toISOString().slice(0, 10), note: 'Lead created in CRM.' }],
        leadScore,
        conversionProbability,
        engagementScore,
        followUpRisk,
        temperature,
        nextBestAction,
        projectInterest: 'General inventory',
        nextAction: inferredNextAction,
        bestCallTimeLabel: temperature === 'Hot' ? 'Today 5–8 PM' : 'Tomorrow 10 AM–2 PM',
        visitRecommendation: temperature === 'Hot' && leadScore >= 80,
    };

    leadsData = [nextLead, ...leadsData];
    pushIntelligenceAddressesToCrm(nextLead.leadSlug, nextLead.presentAddress, nextLead.permanentAddress);
    return nextLead;
}

export function updateIntelligenceLead(id: string, payload: Partial<IntelligenceLead>) {
    let slugForSync = '';
    let presentSync = '';
    let permanentSync = '';
    leadsData = leadsData.map((lead) => {
        if (lead.id !== id) return lead;
        const merged = { ...lead, ...payload };
        const next = {
            ...merged,
            presentAddress: (merged.presentAddress ?? '').trim(),
            permanentAddress: (merged.permanentAddress ?? '').trim(),
        };
        slugForSync = next.leadSlug;
        presentSync = next.presentAddress;
        permanentSync = next.permanentAddress;
        return next;
    });
    if (slugForSync) pushIntelligenceAddressesToCrm(slugForSync, presentSync, permanentSync);
    return getIntelligenceLeadById(id);
}

export function deleteIntelligenceLead(id: string) {
    leadsData = leadsData.filter((lead) => lead.id !== id);
}

export function bulkDeleteIntelligenceLeads(ids: string[]) {
    if (!ids.length) return;
    const remove = new Set(ids);
    leadsData = leadsData.filter((lead) => !remove.has(lead.id));
}
