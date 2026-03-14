'use client';

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

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const statCards = [
  {
    label: 'Total Conversations',
    value: mockStats.totalConversations.toLocaleString(),
    change: '+12%',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Messages Today',
    value: mockStats.messagesToday.toLocaleString(),
    change: '+8%',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    label: 'Avg Response Time',
    value: `${mockStats.avgResponseTime}s`,
    change: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: 'AI Cost Today',
    value: `$${mockStats.aiCostToday.toFixed(2)}`,
    change: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

const systemHealth = [
  { name: 'API Gateway', status: 'green' as const, label: 'Operational' },
  { name: 'Database', status: 'green' as const, label: 'Operational' },
  { name: 'Data Scrapers', status: 'red' as const, label: '1 Failed' },
];

export default function DashboardPage() {
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
            <LineChart data={mockQueryVolumeData}>
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

        {/* Agent Usage Distribution */}
        <div className="chart-container">
          <div className="chart-container-header">
            <span className="chart-container-title">Agent Usage Distribution</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={mockAgentUsageData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: '#64748b' }}
                fontSize={12}
              >
                {mockAgentUsageData.map((_, idx) => (
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
            <BarChart data={mockTopModules} layout="vertical">
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
                  <span style={{ color: item.status === 'green' ? '#10b981' : '#ef4444', fontSize: '0.875rem' }}>
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
