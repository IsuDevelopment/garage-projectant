'use client';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface RadioGroupProps<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  columns?: number;
}

export function RadioGroup<T extends string>({ value, options, onChange, columns = 2 }: RadioGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{ flexBasis: `calc(${100 / columns}% - ${(columns - 1) * 8 / columns}px)`, minWidth: '80px' }}
          className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg text-xs font-medium border transition-all flex-grow
            ${value === opt.value
              ? 'border-amber-400 bg-amber-400/10 text-amber-400'
              : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}
        >
          {opt.icon && <span className="text-base">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
