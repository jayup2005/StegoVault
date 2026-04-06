import { useEffect, useMemo, useState } from 'react';
import { encodeFile, fetchCapacity } from '../api/client';
import AlgorithmPicker from '../components/AlgorithmPicker';
import CapacityMeter from '../components/CapacityMeter';
import DropZone from '../components/DropZone';
import EncodeResult from '../components/EncodeResult';
import PasswordField from '../components/PasswordField';
import { useEncodeStore } from '../store/encodeStore';

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

export default function EncodePage() {
  const {
    file,
    algorithm,
    password,
    message,
    capacity,
    result,
    loading,
    error,
    setFile,
    setAlgorithm,
    setPassword,
    setMessage,
    setCapacity,
    setResult,
    setLoading,
    setError,
    resetResult,
  } = useEncodeStore();

  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const usedBytes = useMemo(() => new TextEncoder().encode(message).length, [message]);
  const capacityPercent = capacity?.available_bytes ? (usedBytes / capacity.available_bytes) * 100 : 0;

  useEffect(() => {
    if (!file) {
      setOriginalPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setOriginalPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!file) {
      setCapacity(null);
      return;
    }

    let cancelled = false;
    setLoading({ capacity: true });
    setError(null);

    fetchCapacity(file, algorithm)
      .then((response) => {
        if (!cancelled) {
          setCapacity(response);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Failed to fetch capacity');
          setCapacity(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading({ capacity: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [algorithm, file, setCapacity, setError, setLoading]);

  async function handleEncode() {
    if (!file || !message) return;

    resetResult();
    setError(null);
    setLoading({ submit: true });

    try {
      const nextResult = await encodeFile({
        file,
        message,
        algorithm,
        password: password || undefined,
      });
      setResult(nextResult);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Encoding failed');
    } finally {
      setLoading({ submit: false });
    }
  }

  const counterTone =
    capacityPercent > 100 ? 'text-danger' : capacityPercent > 80 ? 'text-amber' : 'text-slate-400';

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6 rounded-[32px] border border-panelLine bg-panel/90 p-6 backdrop-blur">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Encode</p>
          <h2 className="mt-3 font-sans text-4xl text-slate-100">Dark forensic encoder</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Drop a carrier image, choose an embedding path, review live capacity, then export the encoded output from the binary API response.
          </p>
        </div>

        {error ? <ErrorBanner message={error} /> : null}

        <DropZone file={file} onFile={setFile} label="Carrier Image" />
        <AlgorithmPicker value={algorithm} onChange={setAlgorithm} />
        <CapacityMeter availableBytes={capacity?.available_bytes ?? 0} usedBytes={usedBytes} loading={loading.capacity} />

        <div className="space-y-3 rounded-[24px] border border-panelLine bg-panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Payload</p>
            <p className={`font-mono text-xs ${counterTone}`}>
              {message.length} chars / {usedBytes} bytes
            </p>
          </div>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={7}
            placeholder="Type the secret message to embed"
            className="w-full rounded-[24px] border border-panelLine bg-panelElevated px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-cyan"
          />
          <p className={`font-mono text-xs ${counterTone}`}>
            {capacityPercent > 100
              ? 'Payload exceeds available capacity.'
              : capacityPercent > 80
                ? 'Payload is above 80% of available capacity.'
                : 'Payload is within safe capacity.'}
          </p>
        </div>

        <PasswordField value={password} onChange={setPassword} />

        <button
          type="button"
          onClick={handleEncode}
          disabled={!file || !message || loading.submit}
          className="rounded-full border border-cyan bg-cyan px-5 py-3 font-mono text-sm font-semibold text-ink transition hover:shadow-[0_0_32px_rgba(0,212,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading.submit ? <SpinnerLabel label="Encoding..." /> : 'Encode Image'}
        </button>
      </div>

      <div className="space-y-6">
        {result ? (
          <EncodeResult originalPreviewUrl={originalPreviewUrl} encodedPreviewUrl={result.blobUrl} result={result} />
        ) : (
          <div className="rounded-[32px] border border-panelLine bg-panel p-6">
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Output</p>
            <h3 className="mt-3 font-sans text-3xl text-slate-100">Awaiting encoded image</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              The diff preview, metadata strip, and download CTA appear after a successful encode response returns binary image data.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
