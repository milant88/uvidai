'use client';

import { useState, useCallback } from 'react';
import {
  mockPrompts,
  mockPromptVersions,
  type AgentPrompt,
  type PromptVersion,
} from '@/lib/mock-data';

function VersionHistorySidebar({
  promptId,
  versions,
  onClose,
}: {
  promptId: string;
  versions: PromptVersion[];
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 280,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
        padding: '1.25rem',
        zIndex: 50,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Version History
        </h3>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {versions.map((v) => (
          <div
            key={v.version}
            style={{
              padding: '0.75rem',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '0.25rem' }}>
              v{v.version}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
              {new Date(v.createdAt).toLocaleString('en-GB')}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {v.summary}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ABTestModal({
  promptName,
  onClose,
  onCreate,
}: {
  promptName: string;
  onClose: () => void;
  onCreate: (config: { trafficSplit: number; evaluationCriteria: string }) => void;
}) {
  const [trafficSplit, setTrafficSplit] = useState(50);
  const [evaluationCriteria, setEvaluationCriteria] = useState('');

  const handleSubmit = () => {
    onCreate({ trafficSplit, evaluationCriteria });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          maxWidth: 420,
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Create A/B Test: {promptName}
        </h3>

        <div className="form-group">
          <label className="form-label">Traffic Split (%)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={trafficSplit}
              onChange={(e) => setTrafficSplit(Number(e.target.value))}
              className="rating-slider"
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: 48, fontWeight: 600, color: 'var(--accent-blue)' }}>
              {trafficSplit}% / {100 - trafficSplit}%
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Evaluation Criteria</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={evaluationCriteria}
            onChange={(e) => setEvaluationCriteria(e.target.value)}
            placeholder="e.g. User satisfaction score, response accuracy, completion rate..."
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Create A/B Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<AgentPrompt[]>(mockPrompts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<Record<string, string>>({});
  const [versionHistoryId, setVersionHistoryId] = useState<string | null>(null);
  const [abTestPrompt, setAbTestPrompt] = useState<AgentPrompt | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setEditingText((prev) => {
      const prompt = prompts.find((p) => p.id === id);
      if (prompt && !prev[id]) return { ...prev, [id]: prompt.text };
      return prev;
    });
  }, [prompts]);

  const handleSave = useCallback((id: string) => {
    const text = editingText[id];
    if (text === undefined) return;
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, text, version: p.version + 1 } : p
      )
    );
    setEditingText((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setExpandedId(null);
  }, [editingText]);

  const handleABTestCreate = useCallback((config: { trafficSplit: number; evaluationCriteria: string }) => {
    console.log('A/B Test created:', config);
    setAbTestPrompt(null);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Prompt Management</h1>
        <p className="page-subtitle">
          View, edit, and version agent prompts
        </p>
      </div>

      <div className="data-table-wrapper mb-3">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }} />
              <th>Name</th>
              <th>Module</th>
              <th>Description</th>
              <th style={{ width: 90, textAlign: 'center' }}>Version</th>
              <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prompts.flatMap((p) => {
              const isExpanded = expandedId === p.id;
              const editText = editingText[p.id] ?? p.text;
              const rows: React.ReactNode[] = [
                <tr key={p.id}>
                  <td>
                    <button
                      onClick={() => toggleExpand(p.id)}
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
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                  <td>
                    <span className="badge badge-blue">{p.module}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 280 }}>
                    {p.description}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                    v{p.version}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setVersionHistoryId(p.id)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      History
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setAbTestPrompt(p)}
                    >
                      Create A/B Test
                    </button>
                  </td>
                </tr>,
              ];
              if (isExpanded) {
                rows.push(
                  <tr key={`${p.id}-expand`}>
                    <td colSpan={6} style={{ padding: 0, borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                      <div
                        style={{
                          padding: '1rem 1.25rem',
                          background: 'var(--bg-primary)',
                          borderTop: '1px solid var(--border-color)',
                        }}
                      >
                        <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                          Prompt Text
                        </label>
                        <textarea
                          className="form-textarea"
                          value={editText}
                          onChange={(e) =>
                            setEditingText((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          rows={8}
                          style={{ marginBottom: '0.75rem' }}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={() => handleSave(p.id)}
                        >
                          Save
                        </button>
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

      {versionHistoryId && mockPromptVersions[versionHistoryId] && (
        <VersionHistorySidebar
          promptId={versionHistoryId}
          versions={mockPromptVersions[versionHistoryId]}
          onClose={() => setVersionHistoryId(null)}
        />
      )}

      {abTestPrompt && (
        <ABTestModal
          promptName={abTestPrompt.name}
          onClose={() => setAbTestPrompt(null)}
          onCreate={handleABTestCreate}
        />
      )}
    </div>
  );
}
