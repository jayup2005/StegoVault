import type { EncodeResult as EncodeResultType } from '../api/client';

type Props = {
  originalPreviewUrl: string | null;
  encodedPreviewUrl: string;
  result: EncodeResultType;
};

export default function EncodeResult({ originalPreviewUrl, encodedPreviewUrl, result }: Props) {
  return (
    <div className="space-y-5 rounded-[28px] border border-panelLine bg-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Encoded Output</p>
          <h3 className="mt-2 font-sans text-2xl text-slate-100">Diff preview and export</h3>
        </div>
        <a
          href={result.blobUrl}
          download="stego_output.png"
          className="inline-flex items-center gap-3 rounded-full border border-cyan bg-cyan px-5 py-3 font-mono text-sm font-semibold text-ink transition hover:shadow-[0_0_32px_rgba(0,212,255,0.3)]"
        >
          <span aria-hidden="true">↓</span>
          Download Encoded Image
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-panelLine bg-panelElevated p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-slate-500">Original</p>
          {originalPreviewUrl ? (
            <img src={originalPreviewUrl} alt="Original carrier" className="h-64 w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl bg-panel text-sm text-slate-500">No preview</div>
          )}
        </div>
        <div className="rounded-[24px] border border-panelLine bg-panelElevated p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-slate-500">Encoded</p>
          <img src={encodedPreviewUrl} alt="Encoded output" className="h-64 w-full rounded-2xl object-cover" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-panelLine px-3 py-2 font-mono text-xs text-slate-300">
          Algorithm: {result.algorithm}
        </span>
        <span className="rounded-full border border-panelLine px-3 py-2 font-mono text-xs text-slate-300">
          Payload: {result.payloadBytes} bytes
        </span>
        <span className="rounded-full border border-panelLine px-3 py-2 font-mono text-xs text-slate-300">
          Encryption: {result.encrypted ? 'AES-256-GCM enabled' : 'Off'}
        </span>
        <span className="rounded-full border border-panelLine px-3 py-2 font-mono text-xs text-slate-300">
          Timestamp: {result.timestamp || 'Unavailable'}
        </span>
      </div>
    </div>
  );
}
