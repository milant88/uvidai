'use client';

import { useState } from 'react';

interface SettingsSection {
  title: string;
  fields: SettingsField[];
}

interface SettingsField {
  id: string;
  label: string;
  description: string;
  type: 'text' | 'select' | 'toggle' | 'number';
  value: string | number | boolean;
  options?: { value: string; label: string }[];
}

const INITIAL_SECTIONS: SettingsSection[] = [
  {
    title: 'General',
    fields: [
      {
        id: 'site-name',
        label: 'Site Name',
        description: 'Display name used in the admin header and emails',
        type: 'text',
        value: 'UvidAI Admin',
      },
      {
        id: 'default-locale',
        label: 'Default Locale',
        description: 'Default language for new conversations',
        type: 'select',
        value: 'sr-Latn',
        options: [
          { value: 'sr-Latn', label: 'Srpski (Latinica)' },
          { value: 'sr-Cyrl', label: 'Српски (Ћирилица)' },
          { value: 'en', label: 'English' },
          { value: 'ru', label: 'Русский' },
        ],
      },
      {
        id: 'items-per-page',
        label: 'Items Per Page',
        description: 'Default pagination size for tables',
        type: 'number',
        value: 10,
      },
    ],
  },
  {
    title: 'AI Provider',
    fields: [
      {
        id: 'primary-provider',
        label: 'Primary Provider',
        description: 'LLM provider used for chat responses',
        type: 'select',
        value: 'gemini',
        options: [
          { value: 'gemini', label: 'Google Gemini' },
          { value: 'openai', label: 'OpenAI' },
          { value: 'anthropic', label: 'Anthropic' },
          { value: 'litellm', label: 'LiteLLM (proxy)' },
        ],
      },
      {
        id: 'model-name',
        label: 'Model',
        description: 'Specific model to use for chat completions',
        type: 'text',
        value: 'gemini-2.0-flash',
      },
      {
        id: 'max-tokens',
        label: 'Max Output Tokens',
        description: 'Maximum tokens in AI response',
        type: 'number',
        value: 4096,
      },
    ],
  },
  {
    title: 'Rate Limiting',
    fields: [
      {
        id: 'rate-limit-enabled',
        label: 'Enable Rate Limiting',
        description: 'Throttle API requests per user',
        type: 'toggle',
        value: true,
      },
      {
        id: 'rate-limit-rpm',
        label: 'Requests Per Minute',
        description: 'Maximum requests per minute per user',
        type: 'number',
        value: 60,
      },
    ],
  },
  {
    title: 'Data Sources',
    fields: [
      {
        id: 'auto-refresh',
        label: 'Auto-refresh Data',
        description: 'Periodically refresh data from external sources',
        type: 'toggle',
        value: true,
      },
      {
        id: 'refresh-interval',
        label: 'Refresh Interval (minutes)',
        description: 'How often to pull fresh data from external APIs',
        type: 'number',
        value: 60,
      },
    ],
  },
];

export default function SettingsPage() {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [saved, setSaved] = useState(false);

  function updateField(sectionIdx: number, fieldId: string, newValue: string | number | boolean) {
    setSections((prev) =>
      prev.map((section, si) =>
        si !== sectionIdx
          ? section
          : {
              ...section,
              fields: section.fields.map((f) =>
                f.id === fieldId ? { ...f, value: newValue } : f,
              ),
            },
      ),
    );
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <button
          className={`btn ${saved ? 'btn-outline' : 'btn-primary'}`}
          onClick={handleSave}
        >
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {sections.map((section, si) => (
          <div key={section.title} className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--foreground)' }}>
              {section.title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {section.fields.map((field) => (
                <div key={field.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor={field.id}
                      style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--foreground)' }}
                    >
                      {field.label}
                    </label>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                      {field.description}
                    </p>
                  </div>
                  <div style={{ width: 240, flexShrink: 0 }}>
                    {field.type === 'text' && (
                      <input
                        id={field.id}
                        className="form-input"
                        type="text"
                        value={field.value as string}
                        onChange={(e) => updateField(si, field.id, e.target.value)}
                        style={{ width: '100%' }}
                      />
                    )}
                    {field.type === 'number' && (
                      <input
                        id={field.id}
                        className="form-input"
                        type="number"
                        value={field.value as number}
                        onChange={(e) => updateField(si, field.id, Number(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    )}
                    {field.type === 'select' && (
                      <select
                        id={field.id}
                        value={field.value as string}
                        onChange={(e) => updateField(si, field.id, e.target.value)}
                        style={{ width: '100%' }}
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {field.type === 'toggle' && (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={field.value as boolean}
                        onClick={() => updateField(si, field.id, !(field.value as boolean))}
                        style={{
                          width: 48,
                          height: 26,
                          borderRadius: 13,
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          background: (field.value as boolean) ? '#2dd4bf' : '#475569',
                          transition: 'background 0.2s',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: 3,
                            left: (field.value as boolean) ? 24 : 3,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#fff',
                            transition: 'left 0.2s',
                          }}
                        />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
