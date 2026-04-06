import type { AlgorithmId } from '../api/client';

export type AlgorithmOption = {
  id: AlgorithmId;
  label: string;
  blurb: string;
  icon: string;
};

export const ALGORITHM_OPTIONS: AlgorithmOption[] = [
  { id: 'lsb-1', label: 'LSB-1', blurb: '1-bit least-significant embedding', icon: '01' },
  { id: 'lsb-2', label: 'LSB-2', blurb: '2-bit least-significant embedding', icon: '10' },
  { id: 'pvd', label: 'PVD', blurb: 'Pixel-value differencing in grayscale pairs', icon: 'PV' },
  { id: 'dct', label: 'DCT', blurb: 'Frequency-domain embedding across 8x8 blocks', icon: 'D8' },
  { id: 'bpcs', label: 'BPCS', blurb: 'Bit-plane complexity segmentation over image blocks', icon: 'BP' },
];

type Props = {
  value: AlgorithmId;
  onChange: (algorithm: AlgorithmId) => void;
};

export default function AlgorithmPicker({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Algorithm</p>
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-600">Hover for details</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {ALGORITHM_OPTIONS.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              title={option.blurb}
              className={`group relative rounded-full border px-4 py-3 text-left transition ${
                active
                  ? 'border-cyan bg-cyan/10 text-cyan shadow-[0_0_24px_rgba(0,212,255,0.18)]'
                  : 'border-panelLine bg-panel text-slate-300 hover:border-cyan/70 hover:bg-cyan/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-current/30 font-mono text-xs">
                  {option.icon}
                </span>
                <span className="font-sans text-sm">{option.label}</span>
              </div>
              <div className="pointer-events-none absolute inset-x-3 top-full z-20 mt-2 rounded-xl border border-panelLine bg-panelElevated p-3 text-xs text-slate-300 opacity-0 shadow-xl transition group-hover:opacity-100">
                {option.blurb}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
