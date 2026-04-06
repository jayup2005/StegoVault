import { decodeFile, analyzeFile } from '../api/client';
import AlgorithmPicker from '../components/AlgorithmPicker';
import AnalysisPanel from '../components/AnalysisPanel';
import DecodeResult from '../components/DecodeResult';
import DropZone from '../components/DropZone';
import PasswordField from '../components/PasswordField';
import { useDecodeStore } from '../store/decodeStore';

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-[20px] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}

function SpinnerLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      {label}
    </span>
  );
}

export default function DecodePage() {
  const {
    file,
    algorithm,
    password,
    result,
    analysisResult,
    loading,
    error,
    setFile,
    setAlgorithm,
    setPassword,
    setResult,
    setAnalysisResult,
    setLoading,
    setError,
  } = useDecodeStore();

  async function handleDecode() {
    if (!file) return;

    setError(null);
    setResult(null);
    setLoading({ submit: true });

    try {
      const nextResult = await decodeFile({
        file,
        algorithm,
        password: password || undefined,
      });
      setResult(nextResult);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Decode failed');
    } finally {
      setLoading({ submit: false });
    }
  }

  async function handleAnalyze() {
    if (!file || !result?.success) return;

    setError(null);
    setLoading({ analysis: true });

    try {
      const nextAnalysis = await analyzeFile(file);
      setAnalysisResult(nextAnalysis);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Analysis failed');
    } finally {
      setLoading({ analysis: false });
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6 rounded-[32px] border border-panelLine bg-panel/90 p-6 backdrop-blur">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Decode</p>
            <h2 className="mt-3 font-sans text-4xl text-slate-100">Recover and verify payloads</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              The steganalysis trigger stays locked until decode succeeds, and it reuses the exact same dropped image file for analysis.
            </p>
          </div>

          {error ? <ErrorBanner message={error} /> : null}

          <DropZone file={file} onFile={setFile} label="Encoded Image" />
          <AlgorithmPicker value={algorithm} onChange={setAlgorithm} />
          <PasswordField value={password} onChange={setPassword} />

          <button
            type="button"
            onClick={handleDecode}
            disabled={!file || loading.submit}
            className="rounded-full border border-cyan bg-cyan px-5 py-3 font-mono text-sm font-semibold text-ink transition hover:shadow-[0_0_32px_rgba(0,212,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading.submit ? <SpinnerLabel label="Decoding..." /> : 'Decode Image'}
          </button>
        </div>

        <div className="space-y-6">
          {result && result.success ? (
            <DecodeResult result={result} onAnalyze={handleAnalyze} loading={loading.analysis} />
          ) : (
            <div className="rounded-[32px] border border-panelLine bg-panel p-6">
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Analysis Gate</p>
              <h3 className="mt-3 font-sans text-3xl text-slate-100">Waiting for successful decode</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                The analysis panel stays hidden until the backend returns a successful decode response.
              </p>
            </div>
          )}
        </div>
      </div>

      {result && result.success && analysisResult ? <AnalysisPanel analysis={analysisResult} /> : null}
    </section>
  );
}
