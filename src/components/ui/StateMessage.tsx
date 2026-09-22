import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  title: string;
  message?: string;
  onRetry?: () => void;
  action?: ReactNode;
  tone?: 'default' | 'error';
}

/** Used for empty and error states: says what happened and what to do next. */
export function StateMessage({ title, message, onRetry, action, tone = 'default' }: Props) {
  return (
    <div
      className={`mx-auto flex max-w-md flex-col items-center rounded-2xl border px-6 py-10 text-center ${
        tone === 'error' ? 'border-red-400/30 bg-red-950/20' : 'border-gold-500/20 bg-coal/60'
      }`}
      role={tone === 'error' ? 'alert' : undefined}
    >
      <h3 className="text-2xl text-cream">{title}</h3>
      {message && <p className="mt-2 text-sm leading-relaxed text-mute">{message}</p>}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
