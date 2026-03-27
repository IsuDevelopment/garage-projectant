'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionSectionProps {
  title: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  /** Max height for the section body before it starts scrolling internally */
  maxBodyHeight?: number;
  children: ReactNode;
}

export function AccordionSection({ title, icon, defaultOpen = false, maxBodyHeight = 400, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-700 rounded-xl" style={{ flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-750 transition-colors rounded-t-xl"
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
          <span className="text-amber-400">{icon}</span>
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          className="p-4 bg-slate-900 border-t border-slate-700 flex flex-col gap-4 sidebar-scroll rounded-b-xl"
          style={{ maxHeight: `${maxBodyHeight}px`, overflowY: 'auto' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
