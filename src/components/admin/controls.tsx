import { useRef, useState } from 'react';
import { toMessage } from '@/lib/errors';
import { uploadImage, type MediaFolder } from '@/services/storage';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition disabled:opacity-50 ${
        checked ? 'border-gold-400 bg-gold-400' : 'border-gold-500/30 bg-ink'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full transition-transform ${
          checked ? 'translate-x-[24px] bg-ink' : 'translate-x-[3px] bg-mute'
        }`}
      />
    </button>
  );
}

interface UploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: MediaFolder;
  label: string;
  hint?: string;
  round?: boolean;
}

/** Picks an image, compresses it in the browser, uploads to Supabase Storage and reports the public URL. */
export function ImageUploader({ value, onChange, folder, label, hint, round = false }: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file, folder));
    } catch (err) {
      setError(toMessage(err, 'Upload failed. Please try again.', true));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-4">
        <div
          className={`relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-gold-500/25 bg-ink/60 ${
            round ? 'rounded-full' : 'rounded-xl'
          }`}
        >
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-mute">No image</span>}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-gold-400">
              <Spinner className="h-6 w-6" />
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            id={`upload-${folder}-${label}`}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {value ? 'Change image' : 'Upload image'}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-mute">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function StatCard({ label, value, note, highlight = false }: { label: string; value: string | number; note?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? 'border-gold-400/50 bg-gold-500/10' : 'border-gold-500/15 bg-coal/80'}`}>
      <p className="text-sm text-mute">{label}</p>
      <p className={`mt-1 font-display text-4xl leading-none ${highlight ? 'gold-text font-bold' : 'text-cream'}`}>{value}</p>
      {note && <p className="mt-2 text-xs text-mute">{note}</p>}
    </div>
  );
}

export function ArrowButtons({
  onUp,
  onDown,
  disableUp,
  disableDown,
  label,
}: {
  onUp: () => void;
  onDown: () => void;
  disableUp?: boolean;
  disableDown?: boolean;
  label: string;
}) {
  const base = 'flex h-9 w-9 items-center justify-center rounded-full text-mute transition hover:bg-white/5 hover:text-gold-300 disabled:opacity-30 disabled:hover:bg-transparent';
  return (
    <div className="flex">
      <button type="button" onClick={onUp} disabled={disableUp} aria-label={`Move ${label} up`} className={base}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
      </button>
      <button type="button" onClick={onDown} disabled={disableDown} aria-label={`Move ${label} down`} className={base}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
    </div>
  );
}

/** Swaps two neighbouring entries and returns the new id order. */
export function moveId(ids: string[], id: string, delta: -1 | 1): string[] {
  const i = ids.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= ids.length) return ids;
  const next = [...ids];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
