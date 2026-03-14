'use client';

import { useState, useCallback } from 'react';
import {
  mockDataSources,
  type DataSource,
  type DataSourceStatus,
} from '@/lib/mock-data';

function StatusBadge({ status }: { status: DataSourceStatus }) {
  const cls =
    status === 'healthy'
      ? 'badge badge-green'
      : status === 'degraded'
        ? 'badge badge-yellow'
        : 'badge badge-red';
  const label =
    status === 'healthy'
      ? 'Healthy'
      : status === 'degraded'
        ? 'Degraded'
        : 'Error';
  return <span className={cls}>{label}</span>;
}

function FreshnessIndicator({ lastRun }: { lastRun: string }) {
  const hours = (Date.now() - new Date(lastRun).getTime()) / (1000 * 60 * 60);
  const status: DataSourceStatus =
    hours < 1 ? 'healthy' : hours < 24 ? 'degraded' : 'error';
  const cls =
    status === 'healthy'
      ? 'badge badge-green'
      : status === 'degraded'
        ? 'badge badge-yellow'
        : 'badge badge-red';
  const label =
    hours < 1
      ? '<1h'
      : hours < 24
        ? '<24h'
        : '>24h';
  return <span className={cls}>{label}</span>;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DataSourcesPage() {
  const sources = mockDataSources;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleRunNow = useCallback((source: DataSource) => {
    console.log('Run now:', source.name);
  }, []);

  const handleRefreshAll = useCallback(() => {
    setRefreshing(true);
    console.log('Refresh all data sources');
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Data Source Health</h1>
          <p className="page-subtitle">
            Monitor and manage external data sources
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleRefreshAll}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing…' : 'Refresh All'}
        </button>
      </div>

      <div className="data-table-wrapper mb-3">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }} />
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Last Run</th>
              <th style={{ textAlign: 'right' }}>Items</th>
              <th style={{ textAlign: 'right' }}>Avg Latency</th>
              <th>Freshness</th>
              <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.flatMap((source) => {
              const isExpanded = expandedId === source.id;
              const rows: React.ReactNode[] = [
                <tr key={source.id}>
                  <td>
                    <button
                      onClick={() => toggleExpand(source.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: 4,
                        transform: isExpanded ? 'rotate(90deg)' : 'none',
                        transition: 'transform 150ms ease',
                      }}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      ▸
                    </button>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {source.name}
                  </td>
                  <td>
                    <span className="badge badge-blue">{source.type}</span>
                  </td>
                  <td>
                    <StatusBadge status={source.status} />
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {formatDateTime(source.lastRun)}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {source.itemsCount.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {source.avgLatencyMs}ms
                  </td>
                  <td>
                    <FreshnessIndicator lastRun={source.lastRun} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRunNow(source)}
                    >
                      Run Now
                    </button>
                  </td>
                </tr>,
              ];
              if (isExpanded) {
                rows.push(
                  <tr key={`${source.id}-expand`}>
                    <td colSpan={9} style={{ padding: 0, borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                      <div
                        style={{
                          padding: '1rem 1.25rem',
                          background: 'var(--bg-primary)',
                          borderTop: '1px solid var(--border-color)',
                        }}
                      >
                        <div className="form-label" style={{ marginBottom: '0.5rem' }}>
                          Error Log
                        </div>
                        {source.errorLog && source.errorLog.length > 0 ? (
                          <pre
                            style={{
                              margin: 0,
                              padding: '0.75rem',
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: 'var(--radius)',
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--accent-red)',
                              overflow: 'auto',
                              maxHeight: 120,
                            }}
                          >
                            {source.errorLog.join('\n')}
                          </pre>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                            No errors recorded.
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }
              return rows;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
