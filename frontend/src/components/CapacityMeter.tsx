type Props = {
  availableBytes: number;
  usedBytes: number;
  loading: boolean;
};

export default function CapacityMeter({ availableBytes, usedBytes, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3 rounded-[24px] border border-panelLine bg-panel p-5">
        <div className="h-4 w-32 animate-pulse rounded-full bg-slate-800" />
        <div className="h-3 w-full animate-pulse rounded-full bg-slate-800" />
        <div className="h-4 w-48 animate-pulse rounded-full bg-slate-800" />
      </div>
    );
  }

  const percent = availableBytes > 0 ? Math.min((usedBytes / availableBytes) * 100, 100) : 0;
  const tone = percent > 100 ? 'bg-danger' : percent > 80 ? 'bg-amber' : 'bg-cyan';

  return (
    <div className="space-y-4 rounded-[24px] border border-panelLine bg-panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Capacity</p>
        <p className="font-mono text-xs text-slate-300">
          {usedBytes} / {availableBytes} bytes
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-900">
        <div className={`h-full rounded-full transition-all duration-300 ${tone}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm text-slate-400">
        The meter updates live from the selected algorithm and the exact UTF-8 byte size of your message.
      </p>
    </div>
  );
}
