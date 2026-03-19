'use client';

import { useEffect, useState } from 'react';
import {
  mockQueryVolumeData,
  mockHourlyData,
  mockCostPerProvider,
  mockLatencyPercentiles,
  mockTopModules,
  mockDailyActiveUsers,
} from '@/lib/mock-data';
import { apiV1 } from '@/lib/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const TABS = ['Usage', 'AI Performance', 'Modules', 'Users'] as const;
type Tab = (typeof TABS)[number];

const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#f8fafc',
};

const moduleSuccessData = [
  { module: 'enrollment', rate: 94 },
  { module: 'academic-info', rate: 91 },
  { module: 'visa-info', rate: 87 },
  { module: 'financial-aid', rate: 85 },
  { module: 'housing', rate: 92 },
  { module: 'campus-life', rate: 96 },
  { module: 'documents', rate: 89 },
  { module: 'exchange', rate: 83 },
];

const retentionData = [
  { day: 'Day 1', pct: 100 },
  { day: 'Day 7', pct: 45 },
  { day: 'Day 14', pct: 30 },
  { day: 'Day 30', pct: 18 },
];

interface AdminUsageAnalytics {
  queryVolumeByDate: { date: string; queries: number }[];
  moduleBreakdown: { module: string; count: number }[];
}

interface AdminAiPerformance {
  tokensUsed: { prompt: number; completion: number; total: number };
  costEstimate: number;
  latencyPercentiles: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  byProvider: { provider: string; tokens: number; requestCount: number }[];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: '1.0625rem',
        fontWeight: 700,
        color: '#f8fafc',
        marginBottom: '1rem',
        marginTop: '0.5rem',
      }}
    >
      {children}
    </h3>
  );
}

function UsageSection({ usage }: { usage: AdminUsageAnalytics | null }) {
  const trends =
    usage && usage.queryVolumeByDate.length > 0
      ? usage.queryVolumeByDate
      : mockQueryVolumeData;

  const topQueryTypes =
    usage && usage.moduleBreakdown.length > 0
      ? [...usage.moduleBreakdown]
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
          .map((m) => ({ type: m.module, count: m.count }))
      : [
          { type: 'Enrollment questions', count: 1245 },
          { type: 'Course information', count: 1089 },
          { type: 'Visa & permits', count: 876 },
          { type: 'Financial aid', count: 654 },
          { type: 'Housing inquiries', count: 543 },
        ];

  const maxTopCount = Math.max(topQueryTypes[0]?.count ?? 1, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid grid-cols-2 gap-2">
        {/* Query Volume by Hour */}
        <div className="chart-container">
          <div className="chart-container-header">
            <h4 className="chart-container-title">Query Volume by Hour</h4>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mockHourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v) => `${v}:00`}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="queries" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Query Trends 30d */}
        <div className="chart-container">
          <div className="chart-container-header">
            <h4 className="chart-container-title">Query Trends (30 days)</h4>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="queries"
                stroke={COLORS[0]}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Query Types */}
      <div className="chart-container">
        <div className="chart-container-header">
          <h4 className="chart-container-title">Top Query Types</h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {topQueryTypes.map((q, i) => (
            <div
              key={q.type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span
                style={{
                  width: 24,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textAlign: 'right',
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: '0.875rem', color: '#f8fafc' }}>
                    {q.type}
                  </span>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#94a3b8',
                    }}
                  >
                    {q.count.toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: '#334155',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(q.count / maxTopCount) * 100}%`,
                      height: '100%',
                      background: COLORS[i % COLORS.length],
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIPerformanceSection({ ai }: { ai: AdminAiPerformance | null }) {
  const costRows = ai
    ? ai.byProvider.map((p) => ({
        provider: p.provider,
        tokens: p.tokens,
        cost: (p.tokens / 1_000_000) * 2.5,
      }))
    : mockCostPerProvider;

  const totalCost = costRows.reduce((s, p) => s + p.cost, 0);
  const totalTokens = ai
    ? ai.tokensUsed.total
    : mockCostPerProvider.reduce((s, p) => s + p.tokens, 0);
  const totalRequests = ai
    ? ai.byProvider.reduce((s, p) => s + p.requestCount, 0)
    : 28_934;
  const avgCostPerQuery =
    totalRequests > 0 ? (totalCost / totalRequests).toFixed(4) : '—';

  const percentileEntries: { label: string; value: number }[] = ai
    ? [
        { label: 'p50', value: ai.latencyPercentiles.p50 / 1000 },
        { label: 'p75', value: ai.latencyPercentiles.p75 / 1000 },
        { label: 'p90', value: ai.latencyPercentiles.p90 / 1000 },
        { label: 'p95', value: ai.latencyPercentiles.p95 / 1000 },
        { label: 'p99', value: ai.latencyPercentiles.p99 / 1000 },
      ]
    : [
        { label: 'p50', value: mockLatencyPercentiles.p50 },
        { label: 'p75', value: mockLatencyPercentiles.p75 },
        { label: 'p90', value: mockLatencyPercentiles.p90 },
        { label: 'p95', value: mockLatencyPercentiles.p95 },
        { label: 'p99', value: mockLatencyPercentiles.p99 },
      ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid grid-cols-2 gap-2">
        {/* Tokens by Provider */}
        <div className="chart-container">
          <div className="chart-container-header">
            <h4 className="chart-container-title">Cost by Provider</h4>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="provider"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [
                  typeof value === 'number' ? `$${value.toFixed(2)}` : '—',
                  'Cost',
                ]}
              />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                {costRows.map((_, i) => (
                  <Cell key={`cost-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tokens by Provider (bar) */}
        <div className="chart-container">
          <div className="chart-container-header">
            <h4 className="chart-container-title">Tokens by Provider</h4>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="provider"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v: number) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${(v / 1_000).toFixed(0)}K`
                }
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [
                  typeof value === 'number' ? value.toLocaleString() : '—',
                  'Tokens',
                ]}
              />
              <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                {costRows.map((_, i) => (
                  <Cell key={`tok-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Distribution Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="stat-card">
          <div className="stat-card-label">Total Cost (est.)</div>
          <div className="stat-card-value">${totalCost.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            {ai ? `${(totalTokens / 1_000_000).toFixed(2)}M tokens` : `${(totalTokens / 1_000_000).toFixed(1)}M tokens`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Avg Cost/Query</div>
          <div className="stat-card-value">${avgCostPerQuery}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Median Cost/Query</div>
          <div className="stat-card-value">{ai ? '—' : '$0.0162'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Max Cost/Query</div>
          <div className="stat-card-value">{ai ? '—' : '$0.1250'}</div>
        </div>
      </div>

      {/* Latency Percentiles */}
      <div className="chart-container">
        <div className="chart-container-header">
          <h4 className="chart-container-title">
            Latency Percentiles (seconds)
          </h4>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.75rem',
          }}
        >
          {percentileEntries.map((p) => (
            <div
              key={p.label}
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  marginBottom: '0.375rem',
                }}
              >
                {p.label}
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: p.value > 3 ? '#ef4444' : p.value > 2 ? '#f59e0b' : '#10b981',
                }}
              >
                {p.value}s
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModulesSection({ usage }: { usage: AdminUsageAnalytics | null }) {
  const moduleActivation =
    usage && usage.moduleBreakdown.length > 0
      ? usage.moduleBreakdown.map((m) => ({ module: m.module, count: m.count }))
      : mockTopModules;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid grid-cols-2 gap-2">
        {/* Module Activation Count */}
        <div className="chart-container">
          <div className="chart-container-header">
            <h4 className="chart-container-title">Module Activation Count</h4>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={moduleActivation}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="module"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Success Rate per Module */}
        <div className="chart-container">
          <div className="chart-container-header">
            <h4 className="chart-container-title">
              Success Rate per Module (%)
            </h4>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={moduleSuccessData} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                dataKey="module"
                type="category"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                width={110}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [typeof value === 'number' ? `${value}%` : '—', 'Success Rate']}
              />
              <Bar dataKey="rate" fill={COLORS[1]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function UsersSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid grid-cols-2 gap-2">
        {/* Daily Active Users */}
        <div className="chart-container">
          <div className="chart-container-header">
            <h4 className="chart-container-title">
              Daily Active Users (30 days)
            </h4>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={mockDailyActiveUsers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="users"
                stroke={COLORS[4]}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Retention Curve */}
        <div className="chart-container">
          <div className="chart-container-header">
            <h4 className="chart-container-title">Retention Curve</h4>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [typeof value === 'number' ? `${value}%` : '—', 'Retention']}
              />
              <Line
                type="monotone"
                dataKey="pct"
                stroke={COLORS[1]}
                strokeWidth={2}
                dot={{ fill: COLORS[1], r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Usage');
  const [usage, setUsage] = useState<AdminUsageAnalytics | null>(null);
  const [aiPerf, setAiPerf] = useState<AdminAiPerformance | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [u, a] = await Promise.all([
          fetch(apiV1('/admin/analytics/usage')),
          fetch(apiV1('/admin/analytics/ai-performance')),
        ]);
        if (cancelled) return;
        if (u.ok) {
          const j: unknown = await u.json();
          const payload =
            j && typeof j === 'object' && 'data' in j
              ? (j as { data: AdminUsageAnalytics }).data
              : (j as AdminUsageAnalytics);
          setUsage(payload);
        }
        if (a.ok) {
          const j: unknown = await a.json();
          const payload =
            j && typeof j === 'object' && 'data' in j
              ? (j as { data: AdminAiPerformance }).data
              : (j as AdminAiPerformance);
          setAiPerf(payload);
        }
      } catch {
        /* demo data */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">
          Deep dive into usage patterns, AI performance, and user behavior
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #334155',
          paddingBottom: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: activeTab === tab ? '#3b82f6' : '#94a3b8',
              background: 'transparent',
              border: 'none',
              borderBottom:
                activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              marginBottom: -1,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div>
        {activeTab === 'Usage' && (
          <>
            <SectionTitle>Usage Analytics</SectionTitle>
            <UsageSection usage={usage} />
          </>
        )}
        {activeTab === 'AI Performance' && (
          <>
            <SectionTitle>AI Performance</SectionTitle>
            <AIPerformanceSection ai={aiPerf} />
          </>
        )}
        {activeTab === 'Modules' && (
          <>
            <SectionTitle>Module Analytics</SectionTitle>
            <ModulesSection usage={usage} />
          </>
        )}
        {activeTab === 'Users' && (
          <>
            <SectionTitle>User Analytics</SectionTitle>
            <UsersSection />
          </>
        )}
      </div>
    </div>
  );
}
