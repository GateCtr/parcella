import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type DataSpinnerProps = {
  label?: string;
  className?: string;
  compact?: boolean;
};

export function DataSpinner({
  label = 'Chargement des données…',
  className,
  compact = false,
}: DataSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-3 text-sm text-muted-foreground',
        compact ? 'py-2' : 'min-h-48 flex-col py-10',
        className,
      )}
    >
      <LoaderCircle aria-hidden="true" className={cn('text-primary motion-safe:animate-spin', compact ? 'h-4 w-4' : 'h-8 w-8')} />
      <span>{label}</span>
    </div>
  );
}