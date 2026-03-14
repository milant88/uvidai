'use client';

import { useCallback, useRef, useState } from 'react';
import styles from './VoiceInput.module.css';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  locale?: string;
}

type VoiceState = 'idle' | 'recording' | 'processing' | 'error' | 'unsupported';

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function VoiceInput({ onTranscript, disabled = false, locale = 'sr-RS' }: VoiceInputProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = typeof window !== 'undefined' && !!getSpeechRecognition();

  const handleClick = useCallback(() => {
    if (!isSupported || disabled) return;

    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = locale;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setState('recording');
    recognition.onend = () => {
      setState((s) => (s === 'error' ? 'error' : 'processing'));
      setTimeout(() => setState('idle'), 300);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setState('error');
      setTimeout(() => setState('idle'), 1500);
      recognitionRef.current = null;
    };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0]?.transcript?.trim() ?? '';
      if (transcript) onTranscript(transcript);
    };

    try {
      recognition.start();
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 1500);
    }
  }, [isSupported, disabled, locale, onTranscript]);

  const buttonClass = [
    styles.button,
    !isSupported ? styles.buttonUnsupported : '',
    state === 'recording' ? styles.buttonRecording : '',
    state === 'processing' ? styles.buttonProcessing : '',
    state === 'idle' && isSupported ? styles.buttonIdle : '',
  ]
    .filter(Boolean)
    .join(' ');

  const title = !isSupported
    ? 'Voice input not supported in this browser'
    : state === 'recording'
      ? 'Recording...'
      : state === 'processing'
        ? 'Processing...'
        : 'Glasovni unos';

  return (
    <button
      type="button"
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled || !isSupported}
      title={title}
      aria-label={title}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}
