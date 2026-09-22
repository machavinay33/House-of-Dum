interface DiamondsProps {
  className?: string;
}

/** The paired-lozenge mark from the House of Dum logo. */
export function DiamondMark({ className = 'h-6 w-12 text-gold-400' }: DiamondsProps) {
  return (
    <svg viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <path d="M12 2l9 10-9 10-9-10z" />
      <path d="M12 7l4.5 5-4.5 5-4.5-5z" />
      <path d="M36 2l9 10-9 10-9-10z" />
      <path d="M36 7l4.5 5-4.5 5-4.5-5z" />
    </svg>
  );
}

/** Scroll-line divider echoing the logo frame: line, lozenge, line. */
export function GoldDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="gold-line h-px w-16 sm:w-28" />
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l10 10-10 10L2 12z" />
        <path d="M12 8l4 4-4 4-4-4z" fill="currentColor" />
      </svg>
      <span className="gold-line h-px w-16 sm:w-28" />
    </div>
  );
}
