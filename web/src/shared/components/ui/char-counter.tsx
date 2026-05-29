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
      ? 'text-destructive'
      : ratio >= 0.9
        ? 'text-warning'
        : 'text-muted-foreground';

  return (
    <p className={`text-xs ${colorClass} ${className ?? ''}`}>
      {current}/{max}
    </p>
  );
}
