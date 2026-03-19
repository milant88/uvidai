'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { mockConversations, type Conversation } from '@/lib/mock-data';
import { apiV1 } from '@/lib/api';
const ITEMS_PER_PAGE = 10;

const MODULE_BADGE_COLORS: Record<string, string> = {
  poi: 'badge-blue',
  'air-quality': 'badge-green',
  legal: 'badge-yellow',
  price: 'badge-red',
  neighborhood: 'badge-purple',
  transport: 'badge-blue',
  business: 'badge-yellow',
  reports: 'badge-green',
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('all');
  const [module, setModule] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiV1('/admin/conversations'));
        if (res.ok) {
          const json = await res.json();
          const rows = json.data;
          if (!Array.isArray(rows)) return;

          setConversations(
            rows.map((c: Record<string, unknown>) => {
              const created = c.createdAt ?? c.startedAt;
              const startedAt =
                typeof created === 'string'
                  ? created
                  : created instanceof Date
                    ? created.toISOString()
                    : String(created ?? '');
              const msgs = c.messages as { module?: string | null }[] | undefined;
              const lastMod = msgs?.[0]?.module ?? 'general';
              const count =
                (c._count as { messages?: number } | undefined)?.messages ??
                msgs?.length ??
                0;

              return {
                id: String(c.id),
                userId: String(c.userId),
                user: String(c.userId),
                module: lastMod,
                modulesUsed: lastMod ? [lastMod] : [],
                language: (c.language as string) ?? undefined,
                rating: (c.rating as number | null | undefined) ?? null,
                startedAt,
                messageCount: count,
              };
            }),
          );
        }
      } catch {
        // API unreachable — keep mock data
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return conversations.filter((conv) => {
      if (search && !(conv.user ?? conv.userId).toLowerCase().includes(search.toLowerCase()) && !conv.id.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (language !== 'all' && conv.language !== language) return false;
      if (module !== 'all' && !(conv.modulesUsed ?? [conv.module]).includes(module)) return false;
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (new Date(conv.startedAt) < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        if (new Date(conv.startedAt) > to) return false;
      }
      return true;
    });
  }, [search, language, module, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number | null) => {
    if (rating === null) return <span className="text-muted">—</span>;
    return (
      <span style={{ color: '#f59e0b', letterSpacing: '2px' }}>
        {'★'.repeat(rating)}
        {'☆'.repeat(5 - rating)}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Conversations</h1>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar mb-2">
        <input
          className="form-input"
          type="text"
          placeholder="Search by user or ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          value={language}
          onChange={(e) => { setLanguage(e.target.value); setPage(1); }}
        >
          <option value="all">All Languages</option>
          <option value="sr-Latn">sr-Latn</option>
          <option value="en">en</option>
        </select>
        <select
          value={module}
          onChange={(e) => { setModule(e.target.value); setPage(1); }}
        >
          <option value="all">All Modules</option>
          <option value="poi">poi</option>
          <option value="air-quality">air-quality</option>
          <option value="legal">legal</option>
          <option value="price">price</option>
          <option value="neighborhood">neighborhood</option>
          <option value="transport">transport</option>
          <option value="business">business</option>
          <option value="reports">reports</option>
        </select>
        <input
          className="form-input"
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          style={{ maxWidth: 160 }}
          placeholder="From"
        />
        <input
          className="form-input"
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          style={{ maxWidth: 160 }}
          placeholder="To"
        />
      </div>

      {/* Table */}
      <div className="data-table-wrapper mb-2">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Started At</th>
              <th>Messages</th>
              <th>Language</th>
              <th>Modules Used</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No conversations found.
                </td>
              </tr>
            ) : (
              paginated.map((conv) => (
                <tr key={conv.id}>
                  <td>
                    <Link
                      href={`/conversations/${conv.id}`}
                      style={{ color: '#3b82f6', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}
                    >
                      {conv.id.slice(0, 13)}…
                    </Link>
                  </td>
                  <td>{conv.user ?? conv.userId}</td>
                  <td>{formatDate(conv.startedAt)}</td>
                  <td>{conv.messageCount}</td>
                  <td>
                    <span className="badge badge-blue">{conv.language ?? conv.module}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {(conv.modulesUsed ?? [conv.module]).map((m) => (
                        <span key={m} className={`badge ${MODULE_BADGE_COLORS[m] || 'badge-blue'}`}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{renderStars(conv.rating ?? null)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
        <span className="pagination-info">
          Page {currentPage} of {totalPages} &middot; {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
