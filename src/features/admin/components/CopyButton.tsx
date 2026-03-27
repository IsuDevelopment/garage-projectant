'use client';

import { useState } from 'react';

interface Props {
  value: string;
  className?: string;
}

export function CopyButton({ value, className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Kopiuj do schowka"
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
        copied
          ? 'border-green-500/40 text-green-400 bg-green-500/10'
          : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white bg-slate-800'
      } ${className}`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Skopiowano
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Kopiuj
        </>
      )}
    </button>
  );
}
