'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  {
    label: 'Overview',
    href: '/',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 8.5l6-6 6 6" />
        <path d="M3.5 7.5V13a1 1 0 001 1h2.5V11h2v3h2.5a1 1 0 001-1V7.5" />
      </svg>
    ),
  },
  {
    label: 'Conversations',
    href: '/conversations',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 3V3z" />
      </svg>
    ),
  },
  {
    label: 'Response Rating',
    href: '/ratings',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1.5l2 4 4.5.5-3.25 3.25.75 4.25L8 11.5 3.75 13.5l.75-4.25L1.5 6l4.5-.5z" />
      </svg>
    ),
  },
  {
    label: 'User Feedback',
    href: '/feedback',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 9V6a3 3 0 016 0v1h1.5a1 1 0 011 1v5a1 1 0 01-1 1H7a1 1 0 01-1-1v-3" />
        <path d="M5 9H3.5a1.5 1.5 0 01-1.5-1.5v-1A1.5 1.5 0 013.5 5H5" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="8" width="3" height="6" rx="0.5" />
        <rect x="6.5" y="4" width="3" height="10" rx="0.5" />
        <rect x="11.5" y="2" width="3" height="12" rx="0.5" />
      </svg>
    ),
  },
  {
    label: 'Prompt Management',
    href: '/prompts',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" />
        <path d="M4 7l2 2-2 2" />
        <path d="M8 11h3" />
      </svg>
    ),
  },
  {
    label: 'Fine-Tuning',
    href: '/fine-tune',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2c-2 0-3.5 1.5-4 3-.5 1.5 0 3 1.5 4 .5.5 1 1 1.5 1.5" />
        <path d="M8 2c2 0 3.5 1.5 4 3 .5 1.5 0 3-1.5 4-.5.5-1 1-1.5 1.5" />
        <path d="M8 6v4M6 8h4" />
        <path d="M4 10c-1 1-1.5 2.5-1 4 .5 1 1.5 1.5 3 1" />
        <path d="M12 10c1 1 1.5 2.5 1 4-.5 1-1.5 1.5-3 1" />
      </svg>
    ),
  },
  {
    label: 'A/B Tests',
    href: '/ab-tests',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4h6v8H2z" />
        <path d="M8 6h6v6H8z" />
        <path d="M2 2v12M8 2v12M14 2v12" />
      </svg>
    ),
  },
  {
    label: 'Data Sources',
    href: '/data-sources',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="8" cy="4" rx="5.5" ry="2" />
        <path d="M2.5 4v8c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V4" />
        <path d="M2.5 8c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="2" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {isOpen ? (
            <>
              <path d="M5 5l10 10" />
              <path d="M15 5L5 15" />
            </>
          ) : (
            <>
              <path d="M3 5h14" />
              <path d="M3 10h14" />
              <path d="M3 15h14" />
            </>
          )}
        </svg>
      </button>

      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">
            <span>Uvid</span>AI Admin
          </span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link${isActive(item.href) ? ' active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className="status-dot status-dot-green" />
            All Systems Operational
          </div>
        </div>
      </aside>
    </>
  );
}
