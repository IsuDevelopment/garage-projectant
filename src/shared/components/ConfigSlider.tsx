'use client';

interface ConfigSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  /** Discrete allowed values — slider index maps to values[i] */
  values?: number[];
  /** Used when values is not provided */
  min?: number;
  max?: number;
  step?: number;
}

export function ConfigSlider({ label, value, onChange, unit = 'm', values, min = 0, max = 100, step = 1 }: ConfigSliderProps) {
  if (values && values.length > 0) {
    // Discrete mode: slider index 0…n-1 maps to values array
    const idx = Math.max(0, values.indexOf(value));
    const safeIdx = idx === -1 ? 0 : idx;
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-baseline">
          <label className="text-sm font-medium text-slate-300">{label}</label>
          <span className="text-sm font-mono text-amber-400 font-semibold">
            {value} {unit}
          </span>
        </div>
        <input
          type="range"
          aria-label={label}
          min={0}
          max={values.length - 1}
          step={1}
          value={safeIdx}
          onChange={e => onChange(values[parseInt(e.target.value)])}
          className="w-full h-1.5 bg-slate-600 rounded-full appearance-none cursor-pointer accent-amber-400"
        />
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>{values[0]} {unit}</span>
          <span>{values[values.length - 1]} {unit}</span>
        </div>
      </div>
    );
  }

  // Range mode — integer steps enforced
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-sm font-mono text-amber-400 font-semibold">
          {Number.isInteger(value) ? value : value.toFixed(1)} {unit}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-600 rounded-full appearance-none cursor-pointer accent-amber-400"
      />
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}
