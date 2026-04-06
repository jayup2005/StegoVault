import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

type ImageMeta = {
  width: number;
  height: number;
  objectUrl: string;
};

type Props = {
  file: File | null;
  onFile: (file: File | null) => void;
  label: string;
};

async function readImageMeta(file: File): Promise<ImageMeta> {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.src = objectUrl;
  await image.decode();
  return { width: image.naturalWidth, height: image.naturalHeight, objectUrl };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DropZone({ file, onFile, label }: Props) {
  const [meta, setMeta] = useState<ImageMeta | null>(null);
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDropAccepted: (accepted) => onFile(accepted[0] ?? null),
  });

  useEffect(() => {
    let disposed = false;
    let currentUrl = '';

    if (!file) {
      setMeta(null);
      return;
    }

    readImageMeta(file)
      .then((next) => {
        if (disposed) {
          URL.revokeObjectURL(next.objectUrl);
          return;
        }
        currentUrl = next.objectUrl;
        setMeta(next);
      })
      .catch(() => {
        setMeta(null);
      });

    return () => {
      disposed = true;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [file]);

  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">{label}</p>
      <div
        {...getRootProps()}
        className={`group relative overflow-hidden rounded-[28px] border border-dashed bg-panel px-6 py-8 transition ${
          isDragActive
            ? 'border-cyan shadow-[0_0_30px_rgba(0,212,255,0.22)]'
            : 'border-panelLine hover:border-cyan/70 hover:shadow-[0_0_30px_rgba(0,212,255,0.14)]'
        } ${isDragReject ? 'border-danger shadow-[0_0_28px_rgba(255,51,102,0.2)]' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-panelLine bg-panelElevated">
            {meta ? (
              <img src={meta.objectUrl} alt={file?.name ?? 'Preview'} className="h-full w-full object-cover" />
            ) : (
              <div className="font-mono text-xs text-slate-500">NO\nIMG</div>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="font-sans text-lg text-slate-100">Drop carrier image here</h3>
            <p className="max-w-xl text-sm text-slate-400">
              Drag and drop a PNG or JPEG, or click to browse. The forensic view updates as soon as the image lands.
            </p>
            {file && meta ? (
              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full border border-panelLine px-3 py-1">{file.name}</span>
                <span className="rounded-full border border-panelLine px-3 py-1">{formatBytes(file.size)}</span>
                <span className="rounded-full border border-panelLine px-3 py-1">
                  {meta.width}×{meta.height}
                </span>
              </div>
            ) : (
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                {isDragActive ? 'Release to ingest image' : 'PNG / JPEG only'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
