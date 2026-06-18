
import { cn } from '../../lib/utils';

export const EcoScore = ({ score, size = 'md' }: { score: number, size?: 'sm' | 'md' | 'lg' }) => {
  const radius = size === 'sm' ? 20 : size === 'md' ? 36 : 48;
  const stroke = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = 'text-green-500';
  if (score < 40) color = 'text-red-500';
  else if (score < 70) color = 'text-yellow-500';

  const sizeClass = size === 'sm' ? 'w-12 h-12' : size === 'md' ? 'w-24 h-24' : 'w-32 h-32';
  const textSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-2xl' : 'text-4xl';

  return (
    <div className={cn("relative flex items-center justify-center", sizeClass)}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          className="text-slate-200"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          className={cn("transition-all duration-1000 ease-out", color)}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={cn("font-bold text-slate-800", textSize)}>{score}</span>
        {size !== 'sm' && <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Score</span>}
      </div>
    </div>
  );
};
