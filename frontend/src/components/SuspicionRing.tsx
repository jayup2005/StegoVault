import { useEffect, useMemo, useState } from 'react';

type Props = {
  score: number;
};

export default function SuspicionRing({ score }: Props) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedScore(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const color = useMemo(() => {
    if (score < 40) return '#00ff9d';
    if (score <= 70) return '#ffaa00';
    return '#ff3366';
  }, [score]);

  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <svg viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#1a2332" strokeWidth="16" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (animatedScore / 100) * circumference}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sans text-4xl text-slate-100">{Math.round(score)}</span>
        <span className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">Suspicion</span>
      </div>
    </div>
  );
}
