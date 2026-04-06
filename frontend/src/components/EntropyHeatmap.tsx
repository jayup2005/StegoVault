type Props = {
  values: number[][];
};

function colorForEntropy(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  const red = Math.round(0 + clamped * 0);
  const green = Math.round(38 + clamped * 174);
  const blue = Math.round(94 + clamped * 161);
  return `rgb(${red}, ${green}, ${blue})`;
}

export default function EntropyHeatmap({ values }: Props) {
  const columnCount = values[0]?.length ?? 0;

  return (
    <div className="rounded-[24px] border border-panelLine bg-panel p-5">
      <div className="flex items-center justify-between">
        <h4 className="font-sans text-xl text-slate-100">Entropy Heatmap</h4>
        <p className="font-mono text-xs text-slate-500">Max 16×16 grid</p>
      </div>
      <div className="mt-5 overflow-x-auto">
        <div
          className="mx-auto inline-grid gap-1 rounded-[20px] border border-panelLine bg-panelElevated p-3"
          style={{ gridTemplateColumns: `repeat(${columnCount}, 14px)` }}
        >
          {values.flatMap((row, rowIndex) =>
            row.map((cell, cellIndex) => (
              <div
                key={`${rowIndex}-${cellIndex}`}
                title={`Entropy ${cell.toFixed(3)}`}
                className="h-[14px] w-[14px] rounded-[4px] border border-black/10"
                style={{ backgroundColor: colorForEntropy(cell) }}
              />
            )),
          )}
        </div>
      </div>
    </div>
  );
}
