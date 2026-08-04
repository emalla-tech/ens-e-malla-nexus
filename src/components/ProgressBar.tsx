interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200" aria-label={`${value}% complete`}>
      <div className="h-full rounded-full bg-brand-orange transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}
