'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockUnratedMessages, mockAdminRatings, type UnratedMessage, type AdminRating } from '@/lib/mock-data';
import { apiV1 } from '@/lib/api';

function mapUnratedMessage(m: Record<string, unknown>): UnratedMessage {
  const created = m.createdAt;
  const createdAt =
    typeof created === 'string'
      ? created
      : created instanceof Date
        ? created.toISOString()
        : '';

  return {
    id: String(m.id),
    content: String(m.content),
    conversationId: String(m.conversationId),
    module: String(m.module ?? 'general'),
    createdAt,
  };
}

function mapApiAdminRating(r: Record<string, unknown>): AdminRating {
  const acc = Number(r.accuracy ?? 0);
  const comp = Number(r.completeness ?? 0);
  const rel = Number(r.relevance ?? 0);
  const tone = Number(r.tone ?? 0);
  const overall = Math.round((acc + comp + rel + tone) / 4);
  const created = r.createdAt;
  const ratedAt =
    typeof created === 'string'
      ? created
      : created instanceof Date
        ? created.toISOString()
        : '';

  return {
    id: String(r.id),
    messageId: String(r.messageId),
    accuracy: acc,
    completeness: comp,
    relevance: rel,
    tone,
    overall,
    overallScore: overall,
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    idealResponse: String(r.idealResponseText ?? ''),
    idealResponseText: String(r.idealResponseText ?? ''),
    notes: r.notes != null ? String(r.notes) : undefined,
    ratedAt,
  };
}

const ALL_TAGS = [
  'accurate',
  'inaccurate',
  'incomplete',
  'wrong_language',
  'hallucination',
  'excellent',
] as const;

type Tag = (typeof ALL_TAGS)[number];

interface RatingForm {
  overall: number;
  accuracy: number;
  completeness: number;
  relevance: number;
  tone: number;
  tags: Tag[];
  idealResponse: string;
}

const emptyForm: RatingForm = {
  overall: 0,
  accuracy: 0,
  completeness: 0,
  relevance: 0,
  tone: 0,
  tags: [],
  idealResponse: '',
};

const SCORE_BUTTONS = [1, 2, 3, 4, 5] as const;

function ScoreButtonRow({
  label,
  value,
  onChange,
  showKeyHint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  showKeyHint?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span
        style={{
          minWidth: 120,
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: '#94a3b8',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        {SCORE_BUTTONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border:
                value === n
                  ? '2px solid #3b82f6'
                  : '1px solid #334155',
              background: value === n ? 'rgba(59,130,246,0.2)' : '#1e293b',
              color: value === n ? '#3b82f6' : '#94a3b8',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 150ms ease',
              position: 'relative',
            }}
          >
            {n}
            {showKeyHint && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 4,
                  fontSize: '0.5rem',
                  color: '#64748b',
                }}
              >
                {n}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RatingsPage() {
  const [unratedMessages, setUnratedMessages] = useState<UnratedMessage[]>(mockUnratedMessages);
  const [ratings, setRatings] = useState<AdminRating[]>(mockAdminRatings);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [form, setForm] = useState<RatingForm>({ ...emptyForm });
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [unratedRes, ratingsRes] = await Promise.all([
          fetch(apiV1('/admin/ratings/unrated')),
          fetch(apiV1('/admin/ratings')),
        ]);
        if (unratedRes.ok) {
          const json = await unratedRes.json();
          const data = json.data;
          if (Array.isArray(data)) {
            setUnratedMessages(
              data.map((m) => mapUnratedMessage(m as Record<string, unknown>)),
            );
          }
        }
        if (ratingsRes.ok) {
          const json = await ratingsRes.json();
          const data = json.data;
          if (Array.isArray(data)) {
            setRatings(
              data.map((row) => mapApiAdminRating(row as Record<string, unknown>)),
            );
          }
        }
      } catch {
        // API unreachable — keep mock data
      }
    }
    load();
  }, []);

  const totalUnrated = unratedMessages.length;
  const totalRated = ratings.length + savedCount;
  const avgScore =
    ratings.length > 0
      ? (
          ratings.reduce((s, r) => s + (r.overall ?? r.overallScore ?? 0), 0) /
          ratings.length
        ).toFixed(1)
      : '—';
  const currentMessage = unratedMessages[currentIndex];
  const isFinished = currentIndex >= totalUnrated;

  const handleSkip = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setForm({ ...emptyForm });
  }, []);

  const handleSave = useCallback(() => {
    if (form.overall === 0) return;
    setSavedCount((c) => c + 1);
    setCurrentIndex((i) => i + 1);
    setForm({ ...emptyForm });
  }, [form.overall]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      )
        return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 5) {
        setForm((f) => ({ ...f, overall: n }));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleTag = (tag: Tag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter((t) => t !== tag)
        : [...f.tags, tag],
    }));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Response Rating Queue</h1>
        <p className="page-subtitle">
          Rate AI responses for quality and accuracy
        </p>
      </div>

      {/* Stats Bar */}
      <div
        className="grid grid-cols-3 gap-2 mb-3"
      >
        <div className="stat-card">
          <div className="stat-card-label">Total Rated</div>
          <div className="stat-card-value">{totalRated}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Unrated</div>
          <div className="stat-card-value">{totalUnrated - savedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Average Score</div>
          <div className="stat-card-value">{avgScore}</div>
        </div>
      </div>

      {/* Progress */}
      <div
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            flex: 1,
            height: 6,
            background: '#334155',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${((savedCount) / totalUnrated) * 100}%`,
              height: '100%',
              background: '#3b82f6',
              borderRadius: 3,
              transition: 'width 300ms ease',
            }}
          />
        </div>
        <span style={{ fontSize: '0.8125rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
          {savedCount} of {totalUnrated} rated
        </span>
      </div>

      {isFinished ? (
        <div
          className="chart-container"
          style={{ textAlign: 'center', padding: '3rem' }}
        >
          <div
            style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}
          >
            &#10003;
          </div>
          <h2 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>
            All caught up!
          </h2>
          <p style={{ color: '#94a3b8' }}>
            No more unrated messages in the queue.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Left: Message Card */}
          <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-blue">{currentMessage.module}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {formatDate(currentMessage.createdAt)}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 'auto' }}>
                ID: {currentMessage.id}
              </span>
            </div>
            <div
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '1.25rem',
                fontSize: '0.9375rem',
                lineHeight: 1.7,
                color: '#f8fafc',
                flex: 1,
              }}
            >
              {currentMessage.content}
            </div>
          </div>

          {/* Right: Rating Form */}
          <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Overall Score */}
            <div>
              <div
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: '#f8fafc',
                  marginBottom: '0.75rem',
                }}
              >
                Overall Score{' '}
                <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 400 }}>
                  (keys 1-5)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {SCORE_BUTTONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, overall: n }))}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      border:
                        form.overall === n
                          ? '2px solid #3b82f6'
                          : '1px solid #334155',
                      background:
                        form.overall === n
                          ? 'rgba(59,130,246,0.2)'
                          : '#0f172a',
                      color: form.overall === n ? '#3b82f6' : '#94a3b8',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Detail Scores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <ScoreButtonRow
                label="Accuracy"
                value={form.accuracy}
                onChange={(v) => setForm((f) => ({ ...f, accuracy: v }))}
              />
              <ScoreButtonRow
                label="Completeness"
                value={form.completeness}
                onChange={(v) => setForm((f) => ({ ...f, completeness: v }))}
              />
              <ScoreButtonRow
                label="Relevance"
                value={form.relevance}
                onChange={(v) => setForm((f) => ({ ...f, relevance: v }))}
              />
              <ScoreButtonRow
                label="Tone"
                value={form.tone}
                onChange={(v) => setForm((f) => ({ ...f, tone: v }))}
              />
            </div>

            {/* Tags */}
            <div>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  marginBottom: '0.5rem',
                }}
              >
                Tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {ALL_TAGS.map((tag) => {
                  const selected = form.tags.includes(tag);
                  return (
                    <label
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.25rem 0.625rem',
                        borderRadius: 9999,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: selected
                          ? 'rgba(59,130,246,0.15)'
                          : '#0f172a',
                        border: selected
                          ? '1px solid #3b82f6'
                          : '1px solid #334155',
                        color: selected ? '#3b82f6' : '#94a3b8',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleTag(tag)}
                        style={{ display: 'none' }}
                      />
                      {tag.replace('_', ' ')}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Ideal Response */}
            <div>
              <label className="form-label">Ideal Response (optional)</label>
              <textarea
                className="form-textarea"
                value={form.idealResponse}
                onChange={(e) =>
                  setForm((f) => ({ ...f, idealResponse: e.target.value }))
                }
                placeholder="Provide the ideal response if the AI's answer was lacking..."
                rows={3}
                style={{ minHeight: 80 }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={handleSkip}>
                Skip
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={form.overall === 0}
              >
                Save &amp; Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
