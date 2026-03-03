import { cn } from '@/lib/utils';

interface ProductivityGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ProductivityGauge({ score, size = 'md' }: ProductivityGaugeProps) {
  const sizes = {
    sm: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    md: { width: 160, strokeWidth: 10, fontSize: 'text-4xl' },
    lg: { width: 200, strokeWidth: 12, fontSize: 'text-5xl' },
  };

  const { width, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return 'text-success stroke-success';
    if (score >= 60) return 'text-primary stroke-primary';
    if (score >= 40) return 'text-warning stroke-warning';
    return 'text-destructive stroke-destructive';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height: width }}>
        <svg className="transform -rotate-90" width={width} height={width}>
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="hsl(217, 33%, 17%)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            className={cn('transition-all duration-1000 ease-out', getScoreColor())}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', fontSize, getScoreColor().split(' ')[0])}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">Score</span>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">Productivity Score</p>
    </div>
  );
}
