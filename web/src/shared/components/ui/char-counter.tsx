interface CharCounterProps {
  current: number;
  max: number;
  showAt?: number;
  className?: string;
}

export function CharCounter({ current, max, showAt = 0.75, className }: CharCounterProps) {
  const ratio = max > 0 ? current / max : 0;

  if (ratio <= showAt) return null;

  const colorClass =
    ratio >= 1
      ? 'text-red-600 dark:text-red-400'
      : ratio >= 0.9
        ? 'text-amber-500 dark:text-amber-400'
        : 'text-zinc-400 dark:text-zinc-500';

  return (
    <p className={`text-xs ${colorClass} ${className ?? ''}`}>
      {current}/{max}
    </p>
  );
}
