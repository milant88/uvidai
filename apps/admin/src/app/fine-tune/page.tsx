'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  mockFineTuneDatasets,
  type FineTuneDataset,
  type FineTuneDatasetStatus,
} from '@/lib/mock-data';
import { apiV1 } from '@/lib/api';

function StatusBadge({ status }: { status: FineTuneDatasetStatus }) {
  const cls =
    status === 'DRAFT'
      ? 'badge badge-yellow'
      : status === 'READY'
        ? 'badge badge-green'
        : status === 'TRAINING'
          ? 'badge badge-blue'
          : 'badge badge-purple';
  return <span className={cls}>{status}</span>;
}

function StatusProgress({ status }: { status: FineTuneDatasetStatus }) {
  const steps = ['DRAFT', 'READY', 'TRAINING', 'DEPLOYED'] as const;
  const idx = steps.indexOf(status);
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {steps.map((s, i) => (
        <span
          key={s}
          style={{
            fontSize: '0.75rem',
            color: i <= idx ? 'var(--accent-blue)' : 'var(--text-muted)',
            fontWeight: i === idx ? 600 : 400,
          }}
        >
          {s}
          {i < steps.length - 1 && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>→</span>
          )}
        </span>
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function excerpt(str: string, len = 60) {
  if (!str || str.length <= len) return str || '—';
  return str.slice(0, len) + '...';
}

export default function FineTunePage() {
  const [datasets, setDatasets] = useState<FineTuneDataset[]>(mockFineTuneDatasets);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createProvider, setCreateProvider] = useState('openai');
  const [loading, setLoading] = useState<string | null>(null);

  const fetchDatasets = useCallback(async () => {
    try {
      const res = await fetch(apiV1('/fine-tune/datasets'));
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setDatasets(
            json.data.map((d: { id?: string; name?: string; description?: string | null; status?: string; items?: unknown[]; _count?: { items: number }; itemCount?: number; modelProvider?: string | null; createdAt?: string }) => ({
              id: d.id ?? '',
              name: d.name ?? '',
              description: d.description ?? null,
              status: (d.status as FineTuneDatasetStatus) ?? 'DRAFT',
              itemCount: d.itemCount ?? d._count?.items ?? 0,
              modelProvider: d.modelProvider ?? null,
              createdAt: d.createdAt ?? new Date().toISOString(),
              items: (d.items ?? []).map((it: unknown) => {
                const i = it as { id?: string; inputMessagesJson?: unknown[]; idealOutput?: string; source?: string };
                return {
                  id: i.id ?? '',
                  inputMessagesExcerpt: Array.isArray(i.inputMessagesJson)
                    ? (i.inputMessagesJson.find((m: unknown) => (m as { role?: string }).role === 'user') as { content?: string })?.content ?? ''
                    : '',
                  idealOutputExcerpt: i.idealOutput ?? '',
                  source: ((i.source as 'ADMIN_REWRITE' | 'HIGH_RATED' | 'USER_APPROVED') ?? 'HIGH_RATED') as 'ADMIN_REWRITE' | 'HIGH_RATED' | 'USER_APPROVED',
                };
              }),
            }))
          );
        }
      }
    } catch {
      setDatasets(mockFineTuneDatasets);
    }
  }, []);

  const toggleExpand = useCallback(
    async (id: string) => {
      const next = expandedId === id ? null : id;
      setExpandedId(next);
      if (next) {
        const ds = datasets.find((d) => d.id === next);
        if (ds && (!ds.items || ds.items.length === 0) && ds.itemCount > 0) {
          try {
            const res = await fetch(apiV1(`/fine-tune/datasets/${next}`));
            if (res.ok) {
              const json = await res.json();
              const d = json.data;
              if (d?.items) {
                setDatasets((prev) =>
                  prev.map((p) =>
                    p.id === next
                      ? {
                          ...p,
                          items: (d.items ?? []).map((it: unknown) => {
                            const i = it as { id?: string; inputMessagesJson?: unknown[]; idealOutput?: string; source?: string };
                            return {
                              id: i.id ?? '',
                              inputMessagesExcerpt: Array.isArray(i.inputMessagesJson)
                                ? (i.inputMessagesJson.find((m: unknown) => (m as { role?: string }).role === 'user') as { content?: string })?.content ?? ''
                                : '',
                              idealOutputExcerpt: i.idealOutput ?? '',
                              source: ((i.source as 'ADMIN_REWRITE' | 'HIGH_RATED' | 'USER_APPROVED') ?? 'HIGH_RATED') as 'ADMIN_REWRITE' | 'HIGH_RATED' | 'USER_APPROVED',
                            };
                          }),
                        }
                      : p
                  )
                );
              }
            }
          } catch {
            // keep mock/empty items
          }
        }
      }
    },
    [expandedId, datasets]
  );

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleCreate = useCallback(async () => {
    if (!createName.trim()) return;
    setLoading('create');
    try {
      const res = await fetch(apiV1('/fine-tune/datasets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDesc.trim() || undefined,
          modelProvider: createProvider,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setCreateName('');
        setCreateDesc('');
        setCreateProvider('openai');
        await fetchDatasets();
      } else {
        const newDs: FineTuneDataset = {
          id: `ds-ft-${Date.now()}`,
          name: createName.trim(),
          description: createDesc.trim() || null,
          status: 'DRAFT',
          itemCount: 0,
          modelProvider: createProvider,
          createdAt: new Date().toISOString(),
          items: [],
        };
        setDatasets((prev) => [newDs, ...prev]);
        setShowCreateModal(false);
        setCreateName('');
        setCreateDesc('');
      }
    } catch {
      const newDs: FineTuneDataset = {
        id: `ds-ft-${Date.now()}`,
        name: createName.trim(),
        description: createDesc.trim() || null,
        status: 'DRAFT',
        itemCount: 0,
        modelProvider: createProvider,
        createdAt: new Date().toISOString(),
        items: [],
      };
      setDatasets((prev) => [newDs, ...prev]);
      setShowCreateModal(false);
      setCreateName('');
      setCreateDesc('');
    } finally {
      setLoading(null);
    }
  }, [createName, createDesc, createProvider, fetchDatasets]);

  const handleAutoCurate = useCallback(async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(apiV1(`/fine-tune/datasets/${id}/auto-curate`), {
        method: 'POST',
      });
      if (res.ok) {
        const json = await res.json();
        setDatasets((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...d, itemCount: json.data?.totalItems ?? d.itemCount + (json.data?.added ?? 0) }
              : d
          )
        );
        await fetchDatasets();
      }
    } catch {
      setDatasets((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, itemCount: d.itemCount + 3 } : d
        )
      );
    } finally {
      setLoading(null);
    }
  }, [fetchDatasets]);

  const handleExport = useCallback(async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(apiV1(`/fine-tune/datasets/${id}/export`));
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dataset-${id}.jsonl`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const mockJsonl = '{"messages":[{"role":"user","content":"test"},{"role":"assistant","content":"response"}]}\n';
        const blob = new Blob([mockJsonl], { type: 'application/x-ndjson' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dataset-${id}.jsonl`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      const mockJsonl = '{"messages":[{"role":"user","content":"test"},{"role":"assistant","content":"response"}]}\n';
      const blob = new Blob([mockJsonl], { type: 'application/x-ndjson' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset-${id}.jsonl`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  }, []);

  const handleTrain = useCallback(async (id: string) => {
    const ds = datasets.find((d) => d.id === id);
    if (ds?.status !== 'READY' && ds?.status !== 'DRAFT') return;
    setLoading(id);
    try {
      const res = await fetch(apiV1(`/fine-tune/datasets/${id}/train`), {
        method: 'POST',
      });
      if (res.ok) {
        const json = await res.json();
        setDatasets((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, status: 'TRAINING' as const } : d
          )
        );
        console.log('Training job:', json.data?.jobId);
      }
    } catch {
      setDatasets((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: 'TRAINING' as const } : d
        )
      );
    } finally {
      setLoading(null);
    }
  }, [datasets]);

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
          <h1 className="page-title">Fine-Tuning</h1>
          <p className="page-subtitle">
            Manage RLHF datasets and trigger fine-tuning jobs
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Create Dataset
        </button>
      </div>

      <div className="data-table-wrapper mb-3">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }} />
              <th>Name</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Items</th>
              <th>Provider</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {datasets.flatMap((ds) => {
              const isExpanded = expandedId === ds.id;
              const rows: React.ReactNode[] = [
                <tr key={ds.id}>
                  <td>
                    <button
                      onClick={() => toggleExpand(ds.id)}
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
                    {ds.name}
                  </td>
                  <td>
                    <StatusBadge status={ds.status} />
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {ds.itemCount}
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      {ds.modelProvider ?? '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {formatDate(ds.createdAt)}
                  </td>
                </tr>,
              ];
              if (isExpanded) {
                rows.push(
                  <tr key={`${ds.id}-expand`}>
                    <td colSpan={6} style={{ padding: 0, borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                      <div
                        style={{
                          padding: '1rem 1.25rem',
                          background: 'var(--bg-primary)',
                          borderTop: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ marginBottom: '1rem' }}>
                          <StatusProgress status={ds.status} />
                        </div>
                        {ds.description && (
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            {ds.description}
                          </p>
                        )}
                        <div className="form-label" style={{ marginBottom: '0.5rem' }}>
                          Dataset Items
                        </div>
                        {ds.items && ds.items.length > 0 ? (
                          <div
                            style={{
                              marginBottom: '1rem',
                              maxHeight: 200,
                              overflow: 'auto',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius)',
                            }}
                          >
                            <table className="data-table" style={{ margin: 0 }}>
                              <thead>
                                <tr>
                                  <th>User Query</th>
                                  <th>Ideal Response</th>
                                  <th>Source</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ds.items.map((item) => (
                                  <tr key={item.id}>
                                    <td style={{ fontSize: '0.8125rem', maxWidth: 200 }}>
                                      {excerpt(item.inputMessagesExcerpt, 50)}
                                    </td>
                                    <td style={{ fontSize: '0.8125rem', maxWidth: 200 }}>
                                      {excerpt(item.idealOutputExcerpt, 50)}
                                    </td>
                                    <td>
                                      <span className="badge badge-blue">{item.source}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                            No items yet. Create dataset items or use Auto-Curate.
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleAutoCurate(ds.id)}
                            disabled={loading === ds.id || (ds.status !== 'DRAFT' && ds.status !== 'READY')}
                          >
                            {loading === ds.id ? '…' : 'Auto-Curate'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleExport(ds.id)}
                            disabled={loading === ds.id}
                          >
                            {loading === ds.id ? '…' : 'Export JSONL'}
                          </button>
                          {(ds.status === 'READY' || ds.status === 'DRAFT') && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleTrain(ds.id)}
                              disabled={loading === ds.id}
                            >
                              {loading === ds.id ? '…' : 'Start Training'}
                            </button>
                          )}
                        </div>
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

      {showCreateModal && (
        <div
          className="modal-overlay"
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
            className="modal-content"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              padding: '1.5rem',
              width: '100%',
              maxWidth: 400,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Create Dataset</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>
                Name
              </label>
              <input
                type="text"
                className="form-input"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Dataset name"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>
                Description
              </label>
              <textarea
                className="form-input"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Optional description"
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>
                Model Provider
              </label>
              <select
                className="form-input"
                value={createProvider}
                onChange={(e) => setCreateProvider(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!createName.trim() || loading === 'create'}
              >
                {loading === 'create' ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
