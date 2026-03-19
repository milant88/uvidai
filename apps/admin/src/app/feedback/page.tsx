'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { mockFeedback, type Feedback } from '@/lib/mock-data';
import { apiV1 } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function mapApiFeedback(f: Record<string, unknown>): Feedback {
  const raw = f.sentiment;
  let sentiment: Feedback['sentiment'] = 'neutral';
  if (raw === 'POSITIVE' || raw === 'positive') sentiment = 'positive';
  else if (raw === 'NEGATIVE' || raw === 'negative') sentiment = 'negative';

  const created = f.createdAt;
  const createdAt =
    typeof created === 'string'
      ? created
      : created instanceof Date
        ? created.toISOString()
        : '';

  return {
    id: String(f.id),
    sentiment,
    comment: String(f.comment ?? ''),
    categories: Array.isArray(f.categories) ? (f.categories as string[]) : [],
    userId: String(f.userId),
    messageId: String(f.messageId),
    conversationId: String(f.conversationId),
    createdAt,
  };
}

const ITEMS_PER_PAGE = 8;

type SentimentFilter = 'all' | 'positive' | 'negative' | 'neutral';

function SentimentIcon({ sentiment }: { sentiment: string }) {
  if (sentiment === 'positive') {
    return (
      <span style={{ color: '#10b981', fontSize: '1.125rem' }} title="Positive">
        &#9650;
      </span>
    );
  }
  if (sentiment === 'negative') {
    return (
      <span style={{ color: '#ef4444', fontSize: '1.125rem' }} title="Negative">
        &#9660;
      </span>
    );
  }
  return (
    <span style={{ color: '#64748b', fontSize: '1.125rem' }} title="Neutral">
      &#8212;
    </span>
  );
}

export default function FeedbackPage() {
  const [feedbackData, setFeedbackData] = useState<Feedback[]>(mockFeedback);
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiV1('/admin/feedback'));
        if (res.ok) {
          const json = await res.json();
          const data = json.data;
          if (Array.isArray(data)) {
            setFeedbackData(data.map((row) => mapApiFeedback(row as Record<string, unknown>)));
          }
        }
      } catch {
        // API unreachable — keep mock data
      }
    }
    load();
  }, []);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    feedbackData.forEach((f) => f.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [feedbackData]);

  const filtered = useMemo(() => {
    let data = [...feedbackData];
    if (sentimentFilter !== 'all') {
      data = data.filter((f) => f.sentiment === sentimentFilter);
    }
    if (categoryFilter !== 'all') {
      data = data.filter((f) => f.categories.includes(categoryFilter));
    }
    if (dateFrom) {
      data = data.filter((f) => f.createdAt >= dateFrom);
    }
    if (dateTo) {
      const toEnd = dateTo + 'T23:59:59Z';
      data = data.filter((f) => f.createdAt <= toEnd);
    }
    return data;
  }, [feedbackData, sentimentFilter, categoryFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const posCount = feedbackData.filter((f) => f.sentiment === 'positive').length;
  const negCount = feedbackData.filter((f) => f.sentiment === 'negative').length;
  const neuCount = feedbackData.filter((f) => f.sentiment === 'neutral').length;
  const total = feedbackData.length;
  const posPct = total > 0 ? ((posCount / total) * 100).toFixed(0) : '0';
  const negPct = total > 0 ? ((negCount / total) * 100).toFixed(0) : '0';
  const neuPct = total > 0 ? ((neuCount / total) * 100).toFixed(0) : '0';

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    feedbackData
      .filter((f) => f.sentiment === 'negative')
      .forEach((f) => f.categories.forEach((c) => {
        counts[c] = (counts[c] || 0) + 1;
      }));
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [feedbackData]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Feedback</h1>
        <p className="page-subtitle">
          Monitor and analyze user sentiment across conversations
        </p>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="stat-card">
          <div className="stat-card-label">Positive</div>
          <div className="stat-card-value" style={{ color: '#10b981' }}>
            {posPct}%
          </div>
          <div className="stat-card-change" style={{ color: '#94a3b8' }}>
            {posCount} reviews
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Negative</div>
          <div className="stat-card-value" style={{ color: '#ef4444' }}>
            {negPct}%
          </div>
          <div className="stat-card-change" style={{ color: '#94a3b8' }}>
            {negCount} reviews
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Neutral</div>
          <div className="stat-card-value" style={{ color: '#94a3b8' }}>
            {neuPct}%
          </div>
          <div className="stat-card-change" style={{ color: '#94a3b8' }}>
            {neuCount} reviews
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Feedback</div>
          <div className="stat-card-value">{total}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar mb-2">
        <select
          className="form-input"
          value={sentimentFilter}
          onChange={(e) => {
            setSentimentFilter(e.target.value as SentimentFilter);
            setPage(1);
          }}
          style={{ maxWidth: 160 }}
        >
          <option value="all">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>

        <select
          className="form-input"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 180 }}
        >
          <option value="all">All Categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="form-input"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 160 }}
        />
        <span style={{ color: '#64748b', fontSize: '0.8125rem' }}>to</span>
        <input
          type="date"
          className="form-input"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 160 }}
        />
      </div>

      {/* Data Table */}
      <div className="data-table-wrapper mb-3">
        <table className="data-table">
          <thead>
            <tr>
              <th>Message Excerpt</th>
              <th style={{ width: 80, textAlign: 'center' }}>Sentiment</th>
              <th>Comment</th>
              <th>Categories</th>
              <th style={{ width: 100 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No feedback matches the current filters.
                </td>
              </tr>
            ) : (
              paged.map((fb) => (
                <tr key={fb.id}>
                  <td>
                    <Link
                      href={`/conversations/${fb.conversationId}`}
                      style={{ color: '#3b82f6', fontSize: '0.8125rem' }}
                    >
                      {fb.messageId}
                    </Link>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <SentimentIcon sentiment={fb.sentiment} />
                  </td>
                  <td style={{ maxWidth: 320 }}>
                    {fb.comment.length > 80
                      ? fb.comment.slice(0, 80) + '...'
                      : fb.comment}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {fb.categories.map((c) => (
                        <span key={c} className="badge badge-blue">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    {formatDate(fb.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination mb-4">
        <button
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          &laquo; Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`pagination-btn${p === page ? ' active' : ''}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="pagination-btn"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next &raquo;
        </button>
        <span className="pagination-info">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Top Complaint Categories */}
      <div className="chart-container">
        <div className="chart-container-header">
          <h3 className="chart-container-title">
            Top Complaint Categories (Negative Feedback)
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={categoryStats} layout="vertical">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              horizontal={false}
            />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis
              dataKey="category"
              type="category"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              width={110}
            />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
              }}
            />
            <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
