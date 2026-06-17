export const EXECUTIVE_BRIEFING = {
    greeting: 'Good Morning, Gangadhar',
    metrics: [
        { label: 'Revenue', change: '+12.4%', trend: 'up' as const, insight: 'Strong residential project performance' },
        { label: 'Bookings', change: '+8.3%', trend: 'up' as const, insight: 'Q2 pipeline converting faster' },
        { label: 'Lead Conversion', change: '+14.2%', trend: 'up' as const, insight: 'AI scoring improving close rates' },
        { label: 'Collections', change: '+5.8%', trend: 'up' as const, insight: 'Recovery agents reducing DSO' },
    ],
    alerts: [
        { text: '3 vendor compliance issues detected', severity: 'warning' as const },
        { text: '2 contracts require immediate review', severity: 'danger' as const },
        { text: 'Inventory shortage detected in Green Valley', severity: 'warning' as const },
    ],
    aiSummary:
        'Our analysis indicates strong sales growth across residential projects. Procurement delays from two vendors may impact inventory availability next week. Immediate review of contract renewals and payment collections is recommended.',
};

export const BUSINESS_HEALTH = {
    overall: 93,
    previousMonth: 88,
    breakdown: [
        { name: 'Sales', score: 94, color: '#2563EB' },
        { name: 'Finance', score: 91, color: '#3B82F6' },
        { name: 'Vendor', score: 87, color: '#1E40AF' },
        { name: 'Project', score: 92, color: '#60A5FA' },
        { name: 'Compliance', score: 89, color: '#10B981' },
        { name: 'Community', score: 95, color: '#34D399' },
    ],
};

export const SUGGESTED_QUESTIONS = [
    'Which leads need immediate attention?',
    'Why are bookings decreasing?',
    'Which vendors are high risk?',
    'Show payment collection risks.',
    'What contracts expire next month?',
    'Which projects have inventory issues?',
];

export const CONVERSATION_HISTORY = [
    { id: '1', query: 'Show top 5 at-risk leads this week', time: '2h ago', preview: '5 leads flagged with declining engagement scores…' },
    { id: '2', query: 'Vendor compliance summary', time: '5h ago', preview: '3 vendors require document renewal within 7 days…' },
    { id: '3', query: 'Green Valley inventory status', time: 'Yesterday', preview: '12 units below safety stock threshold…' },
];

export const INTELLIGENCE_FEED = [
    { id: '1', time: '2 min ago', text: 'Lead conversion increased by 14%.', type: 'success' as const },
    { id: '2', time: '18 min ago', text: 'Vendor ABC insurance expires in 5 days.', type: 'warning' as const },
    { id: '3', time: '45 min ago', text: 'Project Green Valley inventory risk detected.', type: 'danger' as const },
    { id: '4', time: '1h ago', text: 'Contract C204 expires next week.', type: 'warning' as const },
    { id: '5', time: '2h ago', text: 'Collections below target in Hyderabad region.', type: 'danger' as const },
    { id: '6', time: '3h ago', text: 'New booking milestone reached for Skyline Tower.', type: 'success' as const },
];

export const INTELLIGENCE_TABS = ['Sales', 'Demand', 'Vendor', 'Finance', 'Project', 'Community'] as const;

export const TAB_KPIS: Record<string, Array<{ label: string; value: string; change: string; trend: 'up' | 'down'; insight: string; action: string }>> = {
    Sales: [
        { label: 'Revenue', value: '₹42.8Cr', change: '+12.4%', trend: 'up', insight: 'Residential segment driving 68% of growth', action: 'Expand high-converting campaigns' },
        { label: 'Bookings', value: '186', change: '+8.3%', trend: 'up', insight: 'Conversion velocity up 2.1 days', action: 'Prioritize warm pipeline leads' },
        { label: 'Lead Conversion', value: '24.6%', change: '+14.2%', trend: 'up', insight: 'AI scoring improving close rates', action: 'Review low-score lead nurture' },
        { label: 'Pipeline Health', value: '87/100', change: '+5pts', trend: 'up', insight: '₹18Cr weighted pipeline value', action: 'Accelerate stage-3 deals' },
    ],
    Demand: [
        { label: 'Demand Score', value: '78%', change: '+6.2%', trend: 'up', insight: 'Green Valley leads demand spike', action: 'Release held inventory units' },
        { label: 'Inventory Velocity', value: '4.2/wk', change: '+0.8', trend: 'up', insight: 'Premium units moving faster', action: 'Adjust pricing on slow movers' },
        { label: 'Lead Velocity', value: '142/mo', change: '+11%', trend: 'up', insight: 'Digital channels outperforming', action: 'Increase ad spend on top channels' },
        { label: 'Opportunity Score', value: '82/100', change: '+3pts', trend: 'up', insight: '3 high-value opportunities identified', action: 'Assign senior closers' },
    ],
    Vendor: [
        { label: 'Vendor Count', value: '248', change: '+12', trend: 'up', insight: '8 new vendors onboarded this quarter', action: 'Complete onboarding audits' },
        { label: 'Compliance %', value: '91.2%', change: '-2.1%', trend: 'down', insight: '3 vendors missing insurance docs', action: 'Send compliance reminders' },
        { label: 'High Risk Vendors', value: '7', change: '+2', trend: 'down', insight: 'Procurement delays likely', action: 'Review alternative suppliers' },
        { label: 'Vendor Health', value: '87/100', change: '-3pts', trend: 'down', insight: 'Performance scores declining', action: 'Schedule vendor reviews' },
    ],
    Finance: [
        { label: 'Collections', value: '₹8.4Cr', change: '+5.8%', trend: 'up', insight: 'Recovery rate improving', action: 'Focus on 30+ day overdue' },
        { label: 'Outstanding', value: '₹2.1Cr', change: '-8.2%', trend: 'up', insight: 'DSO reduced to 28 days', action: 'Escalate top 5 accounts' },
        { label: 'Cash Flow', value: '₹6.2Cr', change: '+4.1%', trend: 'up', insight: 'Positive net inflow this month', action: 'Optimize payment schedules' },
        { label: 'Recovery Probability', value: '78%', change: '+6%', trend: 'up', insight: 'AI predicts strong Q2 recovery', action: 'Deploy recovery agents' },
    ],
    Project: [
        { label: 'Active Projects', value: '24', change: '+2', trend: 'up', insight: '3 projects ahead of schedule', action: 'Reallocate resources to delayed' },
        { label: 'On-Time Delivery', value: '88%', change: '+3%', trend: 'up', insight: 'Material delays reduced', action: 'Monitor Green Valley closely' },
        { label: 'Budget Utilization', value: '72%', change: '+1.2%', trend: 'up', insight: 'Within planned variance', action: 'Review cost overruns' },
        { label: 'Project Health', value: '90/100', change: '+2pts', trend: 'up', insight: 'Overall portfolio stable', action: 'Address 2 at-risk milestones' },
    ],
    Community: [
        { label: 'Resident Satisfaction', value: '4.6/5', change: '+0.2', trend: 'up', insight: 'Maintenance response improved', action: 'Expand proactive outreach' },
        { label: 'Open Tickets', value: '34', change: '-12%', trend: 'up', insight: 'SLA compliance at 94%', action: 'Assign overflow tickets' },
        { label: 'SLA Compliance', value: '94%', change: '+2%', trend: 'up', insight: 'Average resolution 18h', action: 'Review recurring issues' },
        { label: 'Community Health', value: '95/100', change: '+1pt', trend: 'up', insight: 'Highest score this quarter', action: 'Launch satisfaction survey' },
    ],
};

export const TREND_DATA = {
    revenue: [
        { month: 'Jan', value: 32, forecast: 34 },
        { month: 'Feb', value: 35, forecast: 36 },
        { month: 'Mar', value: 38, forecast: 39 },
        { month: 'Apr', value: 40, forecast: 41 },
        { month: 'May', value: 41, forecast: 43 },
        { month: 'Jun', value: 43, forecast: 45 },
    ],
    conversion: [
        { month: 'Jan', value: 18 },
        { month: 'Feb', value: 19 },
        { month: 'Mar', value: 21 },
        { month: 'Apr', value: 22 },
        { month: 'May', value: 23 },
        { month: 'Jun', value: 25 },
    ],
};

export const RISKS = [
    { id: 'R1', title: 'Vendor ABC compliance lapse', category: 'Vendor', severity: 'critical' as const, score: 92, impact: '₹2.4Cr procurement delay', owner: 'Priya Sharma', due: '2026-06-12' },
    { id: 'R2', title: 'Contract C204 renewal overdue', category: 'Contract', severity: 'critical' as const, score: 88, impact: 'Legal exposure risk', owner: 'Rajesh Kumar', due: '2026-06-14' },
    { id: 'R3', title: 'Invoice INV-204 payment default', category: 'Invoice', severity: 'high' as const, score: 76, impact: '₹18L cash flow impact', owner: 'Anita Desai', due: '2026-06-18' },
    { id: 'R4', title: 'Green Valley inventory shortage', category: 'Inventory', severity: 'high' as const, score: 74, impact: '8% booking delay risk', owner: 'Vikram Singh', due: '2026-06-20' },
    { id: 'R5', title: 'Hyderabad collections below target', category: 'Payment', severity: 'medium' as const, score: 62, impact: '₹42L shortfall', owner: 'Meera Patel', due: '2026-06-25' },
    { id: 'R6', title: 'Skyline Tower milestone slip', category: 'Project', severity: 'medium' as const, score: 58, impact: '2-week delivery delay', owner: 'Arun Reddy', due: '2026-06-28' },
    { id: 'R7', title: 'Community SLA breach trend', category: 'Community', severity: 'low' as const, score: 42, impact: 'Satisfaction dip risk', owner: 'Kavitha Rao', due: '2026-07-05' },
];

export const RECOMMENDATIONS = [
    { id: 'A1', title: 'Review Vendor ABC', confidence: 94, impact: 'Prevent ₹2.4Cr delay', priority: 'Critical', action: 'Review Now' },
    { id: 'A2', title: 'Renew Contract C104', confidence: 91, impact: 'Avoid legal exposure', priority: 'Critical', action: 'Start Renewal' },
    { id: 'A3', title: 'Follow-up Lead L204', confidence: 87, impact: '₹85L opportunity', priority: 'High', action: 'Contact Lead' },
    { id: 'A4', title: 'Recover Invoice INV204', confidence: 82, impact: '₹18L recovery', priority: 'High', action: 'Send Reminder' },
    { id: 'A5', title: 'Resolve Inventory Risk', confidence: 79, impact: 'Protect 8% bookings', priority: 'High', action: 'Allocate Stock' },
    { id: 'A6', title: 'Assign Maintenance Team', confidence: 75, impact: 'Improve SLA to 96%', priority: 'Medium', action: 'Assign Team' },
];

export const PREDICTIONS = [
    { id: 'P1', title: 'Revenue Prediction', forecast: '₹48.2Cr', confidence: 89, impact: 92, explanation: 'Strong pipeline and conversion trends support Q3 growth.', trend: [38, 40, 41, 43, 45, 48] },
    { id: 'P2', title: 'Demand Forecast', forecast: '↑ 14%', confidence: 85, impact: 78, explanation: 'Seasonal demand spike expected in premium segment.', trend: [62, 65, 68, 72, 76, 80] },
    { id: 'P3', title: 'Lead Conversion Forecast', forecast: '26.8%', confidence: 82, impact: 85, explanation: 'AI nurture campaigns improving engagement scores.', trend: [18, 19, 21, 22, 24, 27] },
    { id: 'P4', title: 'Vendor Risk Forecast', forecast: '7 high-risk', confidence: 88, impact: 74, explanation: 'Compliance gaps may widen without intervention.', trend: [3, 4, 5, 5, 6, 7] },
    { id: 'P5', title: 'Payment Forecast', forecast: '₹9.1Cr', confidence: 86, impact: 88, explanation: 'Recovery agents expected to close overdue accounts.', trend: [6.2, 6.8, 7.4, 7.9, 8.4, 9.1] },
    { id: 'P6', title: 'Project Delay Forecast', forecast: '2 projects', confidence: 79, impact: 71, explanation: 'Material shortages may cause minor slippage.', trend: [0, 1, 1, 2, 2, 2] },
    { id: 'P7', title: 'Inventory Forecast', forecast: 'Shortage risk', confidence: 84, impact: 82, explanation: 'Green Valley units below safety threshold by week 3.', trend: [95, 92, 88, 85, 82, 78] },
    { id: 'P8', title: 'Community Satisfaction', forecast: '4.7/5', confidence: 91, impact: 68, explanation: 'Maintenance improvements driving positive sentiment.', trend: [4.2, 4.3, 4.4, 4.5, 4.6, 4.7] },
];

export const AI_AGENTS = [
    { name: 'Lead Intelligence Agent', status: 'active' as const, lastRun: '2 min ago', nextRun: '8 min', records: 1248, health: 98, execTime: '1.2s', successRate: 99.2 },
    { name: 'Demand Intelligence Agent', status: 'active' as const, lastRun: '5 min ago', nextRun: '10 min', records: 892, health: 96, execTime: '2.1s', successRate: 98.8 },
    { name: 'Vendor Compliance Agent', status: 'warning' as const, lastRun: '12 min ago', nextRun: '3 min', records: 248, health: 87, execTime: '3.4s', successRate: 94.1 },
    { name: 'Contract Intelligence Agent', status: 'active' as const, lastRun: '8 min ago', nextRun: '15 min', records: 156, health: 95, execTime: '1.8s', successRate: 97.6 },
    { name: 'Invoice Intelligence Agent', status: 'active' as const, lastRun: '3 min ago', nextRun: '7 min', records: 534, health: 97, execTime: '1.5s', successRate: 98.9 },
    { name: 'Payment Intelligence Agent', status: 'active' as const, lastRun: '6 min ago', nextRun: '9 min', records: 678, health: 96, execTime: '1.9s', successRate: 98.2 },
    { name: 'Project Intelligence Agent', status: 'active' as const, lastRun: '10 min ago', nextRun: '12 min', records: 412, health: 94, execTime: '2.3s', successRate: 97.1 },
    { name: 'Community Intelligence Agent', status: 'active' as const, lastRun: '4 min ago', nextRun: '11 min', records: 324, health: 99, execTime: '1.1s', successRate: 99.5 },
];

export const DEPENDENCY_CHAIN = [
    { step: 'Vendor Compliance Issue', icon: 'vendor' },
    { step: 'Procurement Delay', icon: 'procurement' },
    { step: 'Material Shortage', icon: 'inventory' },
    { step: 'Inventory Risk', icon: 'risk' },
    { step: 'Booking Delay', icon: 'booking' },
    { step: 'Revenue Impact', icon: 'revenue' },
];

export const ROOT_CAUSE_EXPLANATION =
    'Our AI identified compliance issues with two vendors. This may cause procurement delays leading to inventory shortages that could impact booking targets by 8% over the next 30 days.';

export const HEATMAP_DATA = [
    { region: 'Hyderabad', sales: 85, finance: 72, vendor: 78, project: 88 },
    { region: 'Bangalore', sales: 92, finance: 88, vendor: 85, project: 90 },
    { region: 'Chennai', sales: 78, finance: 82, vendor: 80, project: 84 },
    { region: 'Mumbai', sales: 88, finance: 90, vendor: 82, project: 86 },
    { region: 'Pune', sales: 82, finance: 86, vendor: 88, project: 82 },
];
