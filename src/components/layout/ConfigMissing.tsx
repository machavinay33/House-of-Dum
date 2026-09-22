export function ConfigMissing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="max-w-lg rounded-2xl border border-gold-500/30 bg-coal p-8">
        <h1 className="gold-text text-3xl font-bold">Supabase is not connected</h1>
        <p className="mt-3 text-cream/80">
          This website needs two environment variables before it can load the menu and take orders:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-sm text-gold-200">
{`VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY`}
        </pre>
        <p className="mt-4 text-sm text-mute">
          Copy <code>.env.example</code> to <code>.env</code>, fill in your Supabase project values, and restart the dev
          server. On Vercel, add them under Project Settings, then Environment Variables, and redeploy. The README has
          the full steps.
        </p>
      </div>
    </div>
  );
}
