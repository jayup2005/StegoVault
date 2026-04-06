import { useEffect, useState } from 'react';
import DecodePage from './pages/DecodePage';
import EncodePage from './pages/EncodePage';

type TabId = 'encode' | 'decode';

const tabs: Array<{ id: TabId; label: string; blurb: string }> = [
  { id: 'encode', label: 'Encode', blurb: 'Embed payloads into carrier images' },
  { id: 'decode', label: 'Decode', blurb: 'Extract payloads and trigger analysis' },
];

function CryptoLoader() {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-panelLine bg-panelElevated px-4 py-2 font-mono text-xs text-slate-400">
      <div className="flex items-center gap-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-cyan" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-success [animation-delay:120ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber [animation-delay:240ms]" />
      </div>
      <span className="tracking-[0.24em]">AES HASH ENTROPY</span>
    </div>
  );
}

function BootLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink">
      <div className="w-full max-w-xl rounded-[32px] border border-panelLine bg-panel/95 p-8 text-center shadow-[0_0_80px_rgba(0,212,255,0.08)] backdrop-blur">
        <p className="font-mono text-xs uppercase tracking-[0.42em] text-cyan">StegoVault</p>
        <h2 className="mt-4 font-sans text-4xl text-slate-100">Initializing secure forensic workspace</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Loading cryptographic modules, entropy scanners, and steganalysis pipelines.
        </p>
        <div className="mt-8 rounded-[24px] border border-panelLine bg-panelElevated p-5">
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.22em] text-slate-500">
            <span>Cybersecurity boot</span>
            <span>INITIALISING...</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900">
            <div className="h-full w-full animate-[bootScan_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-cyan via-success to-amber" />
          </div>
          <div className="mt-5 grid gap-2 text-left font-mono text-xs text-slate-400">
            <p>&gt; Verifying AES-GCM cipher state</p>
            <p>&gt; Mounting histogram and bit-plane viewers</p>
            <p>&gt; Syncing encode / decode control surfaces</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('encode');
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-slate-100">
      {booting ? <BootLoader /> : null}
      <div className="mx-auto max-w-[1500px] px-4 py-8 md:px-8">
        <header className="mb-8 rounded-[36px] border border-panelLine bg-panel/80 p-6 backdrop-blur">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="font-mono text-xs uppercase tracking-[0.38em] text-cyan">StegoVault</p>
              <h1 className="font-sans text-5xl leading-none text-slate-100 md:text-6xl">Forensic steganography workstation</h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-400">
                Enhanced UI, live capacity intelligence, binary download output, and advanced steganalysis rendered from the real FastAPI backend.
              </p>
              <CryptoLoader />
            </div>
            <div className="mx-auto grid gap-3 md:grid-cols-2 xl:max-w-3xl">
              {tabs.map((tab) => {
                const active = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-[28px] border p-4 text-left transition ${
                      active
                        ? 'border-cyan bg-cyan/10 shadow-[0_0_32px_rgba(0,212,255,0.18)]'
                        : 'border-panelLine bg-panelElevated hover:border-cyan/50'
                    }`}
                  >
                    <p className="font-sans text-xl text-slate-100">{tab.label}</p>
                    <p className="mt-2 text-sm text-slate-400">{tab.blurb}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {activeTab === 'encode' ? <EncodePage /> : <DecodePage />}
      </div>
    </div>
  );
}
