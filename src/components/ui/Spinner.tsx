export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" role="status" aria-label="Loading">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-gold-400">
      <Spinner className="h-9 w-9" />
    </div>
  );
}
