import type { DecodeResult as DecodeResultType } from '../api/client';

type Props = {
  result: DecodeResultType;
  onAnalyze: () => void;
  loading: boolean;
};

export default function DecodeResult({ result, onAnalyze, loading }: Props) {
  return (
    <div className="space-y-4 rounded-[28px] border border-panelLine bg-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Decoded Payload</p>
          <h3 className="mt-2 font-sans text-2xl text-slate-100">Terminal output</h3>
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(result.message)}
          className="rounded-full border border-panelLine px-4 py-2 text-sm text-slate-300 transition hover:border-success hover:text-success"
        >
          Copy to Clipboard
        </button>
      </div>
      <div className="rounded-[24px] border border-success/30 bg-[#0d1117] p-5 font-mono text-sm leading-7 text-success">
        {result.message}
      </div>
      {result.success ? (
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className="rounded-full border border-cyan px-5 py-3 font-mono text-sm text-cyan transition hover:bg-cyan/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Running Steganalysis...' : 'Run Steganalysis →'}
        </button>
      ) : null}
    </div>
  );
}
