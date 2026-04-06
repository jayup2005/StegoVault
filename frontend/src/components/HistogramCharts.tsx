import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalysisResponse } from '../api/client';

type Props = {
  histograms: AnalysisResponse['histograms'];
  pvdZones: AnalysisResponse['pvd_zones'];
  dctHistogram: AnalysisResponse['dct_histogram'];
};

const chartTheme = {
  stroke: '#475569',
  tooltip: {
    backgroundColor: '#0d1117',
    border: '1px solid #1a2332',
    borderRadius: '16px',
  },
};

function histogramData(values: number[]) {
  return values.map((value, index) => ({ bin: index, value }));
}

export default function HistogramCharts({ histograms, pvdZones, dctHistogram }: Props) {
  const rgbData = histogramData(histograms.r);
  const gData = histogramData(histograms.g);
  const bData = histogramData(histograms.b);
  const lData = histogramData(histograms.luminance);
  const dctData = dctHistogram.map((value, index) => ({ bin: index, value }));

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-[24px] border border-panelLine bg-panel p-5">
        <h4 className="font-sans text-xl text-slate-100">Histogram Charts</h4>
        <div className="mt-5 grid gap-4">
          {[
            { title: 'Red channel', data: rgbData, fill: '#ff3366' },
            { title: 'Green channel', data: gData, fill: '#00ff9d' },
            { title: 'Blue channel', data: bData, fill: '#00d4ff' },
            { title: 'Luminance', data: lData, fill: '#94a3b8' },
          ].map((entry) => (
            <div key={entry.title} className="h-48 rounded-2xl border border-panelLine bg-panelElevated p-3">
              <p className="mb-3 text-sm text-slate-300">{entry.title}</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={entry.data}>
                  <CartesianGrid stroke={chartTheme.stroke} strokeDasharray="3 3" />
                  <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={chartTheme.tooltip} />
                  <Bar dataKey="value" fill={entry.fill} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-[24px] border border-panelLine bg-panel p-5">
          <h4 className="font-sans text-xl text-slate-100">Pixel Difference Distribution</h4>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pvdZones}>
                <CartesianGrid stroke={chartTheme.stroke} strokeDasharray="3 3" />
                <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Line type="monotone" dataKey="fraction" stroke="#ffaa00" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-[24px] border border-panelLine bg-panel p-5">
          <h4 className="font-sans text-xl text-slate-100">DCT Coefficient Histogram</h4>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dctData}>
                <CartesianGrid stroke={chartTheme.stroke} strokeDasharray="3 3" />
                <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Bar dataKey="value" fill="#00d4ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
