'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  mockStats,
  mockQueryVolumeData,
  mockAgentUsageData,
  mockTopModules,
} from '@/lib/mock-data';
import { apiV1 } from '@/lib/api';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface DashboardStats {
  totalConversations: number;
  messagesToday: number;
  avgResponseTimeMs: number;
  aiCost: number;
  totalFeedback: number;
}

interface UsagePayload {
  queryVolumeByDate: { date: string; queries: number }[];
  moduleBreakdown: { module: string; count: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [statsRes, usageRes, healthRes] = await Promise.all([
          fetch(apiV1('/admin/stats')),
          fetch(apiV1('/admin/analytics/usage')),
          fetch(apiV1('/health')),
        ]);
        if (cancelled) return;
        setApiOk(healthRes.ok);
        if (statsRes.ok) {
          const j = await statsRes.json();
          const d = (j.data ?? j) as DashboardStats;
          setStats(d);
        }
        if (usageRes.ok) {
          const j = await usageRes.json();
          const d = (j.data ?? j) as UsagePayload;
          setUsage(d);
        }
      } catch {
        if (!cancelled) setApiOk(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const display = stats ?? {
    totalConversations: mockStats.totalConversations,
    messagesToday: mockStats.messagesToday,
    avgResponseTimeMs: mockStats.avgResponseTime * 1000,
    aiCost: mockStats.aiCostToday,
    totalFeedback: mockStats.totalFeedback,
  };

  const volumeData =
    usage && usage.queryVolumeByDate.length > 0
      ? usage.queryVolumeByDate.map((r) => ({ date: r.date, queries: r.queries }))
      : mockQueryVolumeData;

  const pieFromApi =
    usage && usage.moduleBreakdown.length > 0
      ? usage.moduleBreakdown.map((m) => ({
          agent: m.module,
          queries: m.count,
        }))
      : null;

  const pieData = pieFromApi ?? mockAgentUsageData;

  const topModulesData = useMemo(() => {
    if (usage && usage.moduleBreakdown.length > 0) {
      return usage.moduleBreakdown.map((m) => ({
        module: m.module,
        queries: m.count,
      }));
    }
    return mockTopModules.map((m) => ({ module: m.module, queries: m.count }));
  }, [usage]);

  const avgSeconds =
    display.avgResponseTimeMs > 0
      ? (display.avgResponseTimeMs / 1000).toFixed(1)
      : mockStats.avgResponseTime.toFixed(1);

  const statCards = [
    {
      label: 'Total Conversations',
      value: display.totalConversations.toLocaleString(),
      change: null as string | null,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: 'Messages Today',
      value: display.messagesToday.toLocaleString(),
      change: null as string | null,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
    },
    {
      label: 'Avg Response Time',
      value: `${avgSeconds}s`,
      change: null as string | null,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: 'Est. AI cost (cumulative)',
      value: `$${display.aiCost.toFixed(2)}`,
      change: null as string | null,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  const systemHealth = [
    {
      name: 'API',
      status: apiOk ? ('green' as const) : ('red' as const),
      label: apiOk ? 'Operational' : loading ? 'Checking…' : 'Unreachable',
    },
    {
      name: 'Database',
      status: stats ? ('green' as const) : ('yellow' as const),
      label: stats ? 'Operational' : loading ? 'Checking…' : 'Unknown (demo data)',
    },
    {
      name: 'External data APIs',
      status: 'yellow' as const,
      label: 'Best-effort (connectors)',
    },
  ];

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-subtitle">{today}</p>
      </div>

      {loading && (
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Loading live metrics…
        </p>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {statCards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="stat-card-label">{card.label}</span>
              {card.icon}
            </div>
            <div className="stat-card-value">{card.value}</div>
            {card.change && (
              <div className="stat-card-change positive">{card.change}</div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Query Volume */}
        <div className="chart-container">
          <div className="chart-container-header">
            <span className="chart-container-title">Query Volume (Last 30 Days)</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                }}
              />
              <Line
                type="monotone"
                dataKey="queries"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Module / agent share */}
        <div className="chart-container">
          <div className="chart-container-header">
            <span className="chart-container-title">Share by module</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                dataKey="queries"
                nameKey="agent"
                label={({ name, percent }) =>
                  `${String(name ?? '')} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: '#64748b' }}
                fontSize={12}
              >
                {pieData.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Top Modules */}
        <div className="chart-container">
          <div className="chart-container-header">
            <span className="chart-container-title">Top Modules Used</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topModulesData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="module"
                type="category"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="queries" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* System Health */}
        <div className="chart-container">
          <div className="chart-container-header">
            <span className="chart-container-title">System Health</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {systemHealth.map((item) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: '#0f172a',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                }}
              >
                <span style={{ color: '#f8fafc', fontWeight: 500 }}>{item.name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`status-dot status-dot-${item.status}`} />
                  <span
                    style={{
                      color:
                        item.status === 'green'
                          ? '#10b981'
                          : item.status === 'yellow'
                            ? '#f59e0b'
                            : '#ef4444',
                      fontSize: '0.875rem',
                    }}
                  >
                    {item.label}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
