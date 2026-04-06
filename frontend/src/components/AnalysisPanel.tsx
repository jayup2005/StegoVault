import type { AnalysisResponse } from '../api/client';
import EntropyHeatmap from './EntropyHeatmap';
import HistogramCharts from './HistogramCharts';
import LSBPlaneViewer from './LSBPlaneViewer';
import MethodCard from './MethodCard';
import SuspicionRing from './SuspicionRing';

type Props = {
  analysis: AnalysisResponse;
};

export default function AnalysisPanel({ analysis }: Props) {
  const verdictTone =
    analysis.verdict === 'LIKELY_CLEAN'
      ? 'border-success/40 bg-success/10 text-success'
      : analysis.verdict === 'MODERATE'
        ? 'border-amber/40 bg-amber/10 text-amber'
        : 'border-danger/40 bg-danger/10 text-danger';

  return (
    <section className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <div className="rounded-[28px] border border-panelLine bg-panel p-6">
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Suspicion Ring</p>
          <div className="mt-4 flex justify-center">
            <SuspicionRing score={analysis.suspicion_score} />
          </div>
        </div>
        <div className="space-y-5 rounded-[28px] border border-panelLine bg-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Verdict</p>
              <h3 className="mt-2 font-sans text-2xl text-slate-100">Steganalysis dashboard</h3>
            </div>
            <span className={`rounded-full border px-4 py-2 font-mono text-sm ${verdictTone}`}>{analysis.verdict}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {analysis.methods.map((method) => (
              <MethodCard key={method.name} method={method} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-panelLine bg-panel p-6">
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">LSB Plane Viewer</p>
          <h3 className="mt-2 font-sans text-2xl text-slate-100">Green-channel bit planes</h3>
        </div>
        <LSBPlaneViewer planes={analysis.lsb_planes} />
      </div>

      <HistogramCharts
        histograms={analysis.histograms}
        pvdZones={analysis.pvd_zones}
        dctHistogram={analysis.dct_histogram}
      />

      <EntropyHeatmap values={analysis.block_entropies} />
    </section>
  );
}
