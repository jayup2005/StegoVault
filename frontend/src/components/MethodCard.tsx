import { useState } from 'react';
import type { AnalysisMethod } from '../api/client';

type Props = {
  method: AnalysisMethod;
};

export default function MethodCard({ method }: Props) {
  const [open, setOpen] = useState(false);
  const color = method.score < 40 ? 'bg-success' : method.score <= 70 ? 'bg-amber' : 'bg-danger';

  return (
    <div className="rounded-[24px] border border-panelLine bg-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-sans text-lg text-slate-100">{method.name}</h4>
          <p className="mt-1 text-sm text-slate-400">{method.interpretation}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-full border border-panelLine px-3 py-1 text-xs text-slate-300 transition hover:border-cyan hover:text-cyan"
        >
          {open ? 'Hide' : 'Details'}
        </button>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${method.score}%` }} />
      </div>
      <p className="mt-2 font-mono text-xs text-slate-400">{method.score.toFixed(2)} / 100</p>
      {open ? (
        <div className="mt-4 space-y-2 rounded-2xl border border-panelLine bg-panelElevated p-4 font-mono text-xs text-slate-300">
          {Object.entries(method.details).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-slate-500">{key}</span>
              <span>{String(value)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
