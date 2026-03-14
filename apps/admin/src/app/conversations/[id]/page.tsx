'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  mockMessages,
  mockFeedback,
  mockAdminRatings,
  mockConversations,
} from '@/lib/mock-data';

const TAG_OPTIONS = [
  'accurate',
  'inaccurate',
  'incomplete',
  'wrong_language',
  'hallucination',
  'excellent',
] as const;

interface RatingFormState {
  overallScore: number;
  accuracy: number;
  completeness: number;
  relevance: number;
  tone: number;
  idealResponse: string;
  tags: string[];
  notes: string;
}

const defaultRating: RatingFormState = {
  overallScore: 3,
  accuracy: 3,
  completeness: 3,
  relevance: 3,
  tone: 3,
  idealResponse: '',
  tags: [],
  notes: '',
};

function getExistingRating(messageId: string): RatingFormState | null {
  const existing = mockAdminRatings.find((r) => r.messageId === messageId);
  if (!existing) return null;
  return {
    overallScore: existing.overallScore ?? existing.overall,
    accuracy: existing.accuracy,
    completeness: existing.completeness,
    relevance: existing.relevance,
    tone: existing.tone,
    idealResponse: existing.idealResponse ?? existing.idealResponseText ?? '',
    tags: [...existing.tags],
    notes: existing.notes ?? '',
  };
}

export default function ConversationDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);

  const conversation = mockConversations.find((c) => c.id === id);
  const messages = mockMessages.filter((m) => m.conversationId === id);
  const feedback = mockFeedback.filter((f) => f.conversationId === id);

  const [expandedRating, setExpandedRating] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, RatingFormState>>({});
  const [savedMessages, setSavedMessages] = useState<Set<string>>(new Set());

  const getRating = (messageId: string): RatingFormState => {
    if (ratings[messageId]) return ratings[messageId];
    const existing = getExistingRating(messageId);
    return existing || { ...defaultRating };
  };

  const updateRating = (
    messageId: string,
    updates: Partial<RatingFormState>
  ) => {
    setRatings((prev) => ({
      ...prev,
      [messageId]: { ...getRating(messageId), ...updates },
    }));
  };

  const toggleTag = (messageId: string, tag: string) => {
    const current = getRating(messageId);
    const newTags = current.tags.includes(tag)
      ? current.tags.filter((t) => t !== tag)
      : [...current.tags, tag];
    updateRating(messageId, { tags: newTags });
  };

  const handleSave = (messageId: string) => {
    setSavedMessages((prev) => new Set(prev).add(messageId));
    setTimeout(() => {
      setSavedMessages((prev) => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }, 2000);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      {/* Back Button */}
      <Link
        href="/conversations"
        className="btn btn-secondary btn-sm mb-2"
        style={{ display: 'inline-flex' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Conversations
      </Link>

      {/* Conversation Header */}
      <div className="stat-card mb-3">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
          Conversation Detail
        </h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#94a3b8' }}>
          <span>
            <strong style={{ color: '#f8fafc' }}>ID:</strong>{' '}
            <span className="font-mono">{id.slice(0, 20)}…</span>
          </span>
          {conversation && (
            <>
              <span>
                <strong style={{ color: '#f8fafc' }}>User:</strong> {conversation.user}
              </span>
              <span>
                <strong style={{ color: '#f8fafc' }}>Date:</strong>{' '}
                {formatDate(conversation.startedAt)}
              </span>
              <span>
                <strong style={{ color: '#f8fafc' }}>Language:</strong>{' '}
                <span className="badge badge-blue">{conversation.language}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="mb-3">
        {messages.length === 0 ? (
          <div className="stat-card" style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
            No messages found for this conversation.
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isExpanded = expandedRating === msg.id;
            const rating = getRating(msg.id);
            const msgFeedback = feedback.filter((f) => f.messageId === msg.id);

            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '75%',
                    minWidth: '40%',
                  }}
                >
                  {/* Message Bubble */}
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      background: isUser ? 'rgba(59, 130, 246, 0.15)' : '#1e293b',
                      border: `1px solid ${isUser ? 'rgba(59, 130, 246, 0.3)' : '#334155'}`,
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: isUser ? '#60a5fa' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {msg.role}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    {msg.content}
                  </div>

                  {/* Assistant Metadata */}
                  {!isUser && msg.metadata && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem', padding: '0 0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                      <span>Module: <strong style={{ color: '#94a3b8' }}>{msg.metadata.module}</strong></span>
                      <span>Model: <strong style={{ color: '#94a3b8' }}>{msg.metadata.provider}/{msg.metadata.model}</strong></span>
                      <span>
                        Tokens: {msg.metadata.tokens.prompt}/{msg.metadata.tokens.completion}/{msg.metadata.tokens.total}
                      </span>
                      <span>Latency: {msg.metadata.latencyMs}ms</span>
                      <span>Tool calls: {msg.metadata.toolCalls}</span>
                    </div>
                  )}

                  {/* Rating Toggle for Assistant Messages */}
                  {!isUser && (
                    <div style={{ marginTop: '0.5rem', padding: '0 0.25rem' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setExpandedRating(isExpanded ? null : msg.id)}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {isExpanded ? '▾ Hide Rating Form' : '▸ Rate This Response'}
                      </button>
                    </div>
                  )}

                  {/* Rating Form */}
                  {!isUser && isExpanded && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '1.25rem',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    >
                      {/* Sliders */}
                      {(
                        [
                          ['overallScore', 'Overall Score'],
                          ['accuracy', 'Accuracy'],
                          ['completeness', 'Completeness'],
                          ['relevance', 'Relevance'],
                          ['tone', 'Tone'],
                        ] as const
                      ).map(([key, label]) => (
                        <div className="form-group" key={key}>
                          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{label}</span>
                            <span style={{ color: '#3b82f6', fontWeight: 700 }}>
                              {rating[key]}
                            </span>
                          </label>
                          <input
                            type="range"
                            min={1}
                            max={5}
                            step={1}
                            className="rating-slider"
                            value={rating[key]}
                            onChange={(e) =>
                              updateRating(msg.id, {
                                [key]: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      ))}

                      {/* Ideal Response */}
                      <div className="form-group">
                        <label className="form-label">Ideal Response</label>
                        <textarea
                          className="form-textarea"
                          rows={3}
                          value={rating.idealResponse}
                          onChange={(e) =>
                            updateRating(msg.id, {
                              idealResponse: e.target.value,
                            })
                          }
                          placeholder="What would the ideal response look like?"
                        />
                      </div>

                      {/* Tags */}
                      <div className="form-group">
                        <label className="form-label">Tags</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {TAG_OPTIONS.map((tag) => {
                            const isActive = rating.tags.includes(tag);
                            return (
                              <label
                                key={tag}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  padding: '0.25rem 0.625rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  background: isActive ? 'rgba(59, 130, 246, 0.2)' : '#1e293b',
                                  border: `1px solid ${isActive ? '#3b82f6' : '#334155'}`,
                                  color: isActive ? '#60a5fa' : '#94a3b8',
                                  transition: 'all 150ms ease',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => toggleTag(msg.id, tag)}
                                  style={{ display: 'none' }}
                                />
                                {tag}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          value={rating.notes}
                          onChange={(e) =>
                            updateRating(msg.id, { notes: e.target.value })
                          }
                          placeholder="Additional notes about this response..."
                        />
                      </div>

                      <button
                        className="btn btn-primary"
                        onClick={() => handleSave(msg.id)}
                      >
                        {savedMessages.has(msg.id) ? '✓ Saved' : 'Save Rating'}
                      </button>
                    </div>
                  )}

                  {/* Per-message Feedback */}
                  {msgFeedback.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      {msgFeedback.map((fb) => (
                        <div
                          key={fb.id}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            color: '#f59e0b',
                            marginTop: '0.25rem',
                          }}
                        >
                          <strong>User feedback:</strong> {'★'.repeat(fb.rating ?? 0)}{'☆'.repeat(5 - (fb.rating ?? 0))}{' '}
                          — {fb.comment}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Feedback Summary */}
      {feedback.length > 0 && (
        <div className="stat-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>
            User Feedback on This Conversation
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {feedback.map((fb) => (
              <div
                key={fb.id}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#0f172a',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                    {'★'.repeat(fb.rating ?? 0)}{'☆'.repeat(5 - (fb.rating ?? 0))}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                    {formatDate(fb.createdAt)}
                  </span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                  {fb.comment}
                </p>
                <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
                  Re: message {fb.messageId}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
