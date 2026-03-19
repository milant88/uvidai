'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiV1 } from '@/lib/api';

interface AbTest {
  id: string;
  name: string;
  promptVariantA: string;
  promptVariantB: string;
  trafficSplit: number;
  status: string;
  startDate: string | null;
  createdAt: string;
  results?: {
    variantA: { queryCount: number; avgUserRating: number; avgAdminRating: number };
    variantB: { queryCount: number; avgUserRating: number; avgAdminRating: number };
    zScore?: number;
    significant?: boolean;
  };
}

const mockAbTests: AbTest[] = [
  {
    id: 'ab-1',
    name: 'Visa Response Tone',
    promptVariantA: 'Be formal and concise when answering visa questions.',
    promptVariantB: 'Be friendly and conversational when answering visa questions.',
    trafficSplit: 50,
    status: 'active',
    startDate: '2026-03-10T09:00:00Z',
    createdAt: '2026-03-10T09:00:00Z',
    results: {
      variantA: { queryCount: 35, avgUserRating: 4.2, avgAdminRating: 4.5 },
      variantB: { queryCount: 38, avgUserRating: 3.8, avgAdminRating: 4.1 },
      zScore: 1.98,
      significant: true,
    },
  },
  {
    id: 'ab-2',
    name: 'Enrollment Detail Level',
    promptVariantA: 'Provide brief, direct answers.',
    promptVariantB: 'Provide detailed answers with examples.',
    trafficSplit: 60,
    status: 'paused',
    startDate: null,
    createdAt: '2026-03-12T14:00:00Z',
  },
];

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active'
      ? 'badge badge-green'
      : status === 'paused'
        ? 'badge badge-yellow'
        : status === 'completed'
          ? 'badge badge-blue'
          : 'badge badge-gray';
  return <span className={cls}>{status}</span>;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AbTestsPage() {
  const [tests, setTests] = useState<AbTest[]>(mockAbTests);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createA, setCreateA] = useState('');
  const [createB, setCreateB] = useState('');
  const [createSplit, setCreateSplit] = useState(50);

  const fetchTests = useCallback(async () => {
    try {
      const res = await fetch(apiV1('/ab-tests'));
      if (res.ok) {
        const json = await res.json();
        if (json.data?.length) setTests(json.data);
      }
    } catch {
      setTests(mockAbTests);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleCreate = useCallback(async () => {
    if (!createName.trim() || !createA.trim() || !createB.trim()) return;
    try {
      const res = await fetch(apiV1('/ab-tests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          promptVariantA: createA.trim(),
          promptVariantB: createB.trim(),
          trafficSplit: createSplit,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setTests((prev) => [json.data, ...prev]);
        setShowCreateModal(false);
        setCreateName('');
        setCreateA('');
        setCreateB('');
        setCreateSplit(50);
      } else {
        const newTest: AbTest = {
          id: `ab-${Date.now()}`,
          name: createName.trim(),
          promptVariantA: createA.trim(),
          promptVariantB: createB.trim(),
          trafficSplit: createSplit,
          status: 'draft',
          startDate: null,
          createdAt: new Date().toISOString(),
        };
        setTests((prev) => [newTest, ...prev]);
        setShowCreateModal(false);
        setCreateName('');
        setCreateA('');
        setCreateB('');
      }
    } catch {
      const newTest: AbTest = {
        id: `ab-${Date.now()}`,
        name: createName.trim(),
        promptVariantA: createA.trim(),
        promptVariantB: createB.trim(),
        trafficSplit: createSplit,
        status: 'draft',
        startDate: null,
        createdAt: new Date().toISOString(),
      };
      setTests((prev) => [newTest, ...prev]);
      setShowCreateModal(false);
      setCreateName('');
      setCreateA('');
      setCreateB('');
    }
  }, [createName, createA, createB, createSplit]);

  const handleStatusChange = useCallback(
    async (id: string, status: 'active' | 'paused' | 'completed') => {
      try {
        const res = await fetch(apiV1(`/ab-tests/${id}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          const json = await res.json();
          setTests((prev) =>
            prev.map((t) => (t.id === id ? json.data : t))
          );
        } else {
          setTests((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status } : t))
          );
        }
      } catch {
        setTests((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status } : t))
        );
      }
    },
    []
  );

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 className="page-title">A/B Tests</h1>
          <p className="page-subtitle">
            Compare prompt variants and measure impact
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Create A/B Test
        </button>
      </div>

      <div className="data-table-wrapper mb-3">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }} />
              <th>Name</th>
              <th>Status</th>
              <th>Split</th>
              <th>Started</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.flatMap((test) => {
              const isExpanded = expandedId === test.id;
              return [
                <tr key={test.id}>
                  <td>
                    <button
                      onClick={() => setExpandedId((p) => (p === test.id ? null : test.id))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: 4,
                        transform: isExpanded ? 'rotate(90deg)' : 'none',
                        transition: 'transform 150ms ease',
                      }}
                    >
                      ▸
                    </button>
                  </td>
                  <td style={{ fontWeight: 600 }}>{test.name}</td>
                  <td>
                    <StatusBadge status={test.status} />
                  </td>
                  <td>
                    {test.trafficSplit}% / {100 - test.trafficSplit}%
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {formatDate(test.startDate)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {test.status !== 'active' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStatusChange(test.id, 'active')}
                        >
                          Activate
                        </button>
                      )}
                      {test.status === 'active' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStatusChange(test.id, 'paused')}
                        >
                          Pause
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange(test.id, 'completed')}
                      >
                        Complete
                      </button>
                    </div>
                  </td>
                </tr>,
                isExpanded && (
                  <tr key={`${test.id}-expand`}>
                    <td colSpan={6} style={{ padding: 0, verticalAlign: 'top' }}>
                      <div
                        style={{
                          padding: '1rem 1.25rem',
                          background: 'var(--bg-primary)',
                          borderTop: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <div className="form-label">Variant A</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                              {test.promptVariantA}
                            </div>
                          </div>
                          <div>
                            <div className="form-label">Variant B</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                              {test.promptVariantB}
                            </div>
                          </div>
                        </div>
                        {test.results && (
                          <div style={{ marginTop: '1rem' }}>
                            <div className="form-label">Results</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                              <div className="stat-card">
                                <div className="stat-card-label">Variant A</div>
                                <div className="stat-card-value">{test.results.variantA.queryCount} queries</div>
                                <div className="stat-card-change">
                                  User: {test.results.variantA.avgUserRating.toFixed(1)} · Admin: {test.results.variantA.avgAdminRating.toFixed(1)}
                                </div>
                              </div>
                              <div className="stat-card">
                                <div className="stat-card-label">Variant B</div>
                                <div className="stat-card-value">{test.results.variantB.queryCount} queries</div>
                                <div className="stat-card-change">
                                  User: {test.results.variantB.avgUserRating.toFixed(1)} · Admin: {test.results.variantB.avgAdminRating.toFixed(1)}
                                </div>
                              </div>
                            </div>
                            {test.results.zScore != null && (
                              <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                Z-score: {test.results.zScore.toFixed(2)}
                                {test.results.significant && (
                                  <span className="badge badge-green" style={{ marginLeft: '0.5rem' }}>
                                    Statistically significant
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ),
              ].filter(Boolean);
            })}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              padding: '1.5rem',
              width: '100%',
              maxWidth: 480,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Create A/B Test</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Name</label>
              <input
                type="text"
                className="form-input"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Test name"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Variant A</label>
              <textarea
                className="form-input"
                value={createA}
                onChange={(e) => setCreateA(e.target.value)}
                placeholder="Prompt for variant A"
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Variant B</label>
              <textarea
                className="form-input"
                value={createB}
                onChange={(e) => setCreateB(e.target.value)}
                placeholder="Prompt for variant B"
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>
                Traffic Split (A %)
              </label>
              <input
                type="number"
                className="form-input"
                value={createSplit}
                onChange={(e) => setCreateSplit(Number(e.target.value) || 50)}
                min={0}
                max={100}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!createName.trim() || !createA.trim() || !createB.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
