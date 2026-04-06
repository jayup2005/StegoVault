import { useEffect, useRef } from 'react';
import type { AnalysisResponse } from '../api/client';

type Props = {
  planes: AnalysisResponse['lsb_planes'];
};

function PlaneCanvas({ plane }: { plane: AnalysisResponse['lsb_planes'][number] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    canvas.width = plane.width;
    canvas.height = plane.height;

    const context = canvas.getContext('2d');
    if (!context) return;

    const imageData = context.createImageData(plane.width, plane.height);
    for (let y = 0; y < plane.height; y += 1) {
      for (let x = 0; x < plane.width; x += 1) {
        const index = (y * plane.width + x) * 4;
        const value = plane.data[y][x] ? 255 : 0;
        imageData.data[index] = value;
        imageData.data[index + 1] = value;
        imageData.data[index + 2] = value;
        imageData.data[index + 3] = 255;
      }
    }
    context.putImageData(imageData, 0, 0);
  }, [plane]);

  return (
    <div className="space-y-3 rounded-[22px] border border-panelLine bg-panel p-4">
      <div className="flex items-center justify-between">
        <p className="font-sans text-base text-slate-100">Plane {plane.plane}</p>
        <p className="font-mono text-xs text-slate-500">{plane.plane === 0 ? 'LSB' : plane.plane === 7 ? 'MSB' : 'BIT'}</p>
      </div>
      <canvas ref={ref} className="w-full rounded-xl border border-panelLine bg-black [image-rendering:pixelated]" />
    </div>
  );
}

export default function LSBPlaneViewer({ planes }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {planes.map((plane) => (
        <PlaneCanvas key={plane.plane} plane={plane} />
      ))}
    </div>
  );
}
