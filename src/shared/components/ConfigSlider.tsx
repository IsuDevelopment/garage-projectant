'use client';

interface ConfigSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

export function ConfigSlider({ label, value, min, max, step, unit = 'm', onChange }: ConfigSliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-sm font-mono text-amber-400 font-semibold">
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <input
        type="range"
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
