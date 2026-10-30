export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-ink" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading AvenBrief newsroom…</span>
      <div className="mx-auto max-w-[1180px] animate-pulse px-6 py-10 md:px-10">
        <div className="h-3 w-40 rounded bg-blue-100" />
        <div className="mt-4 h-12 w-56 rounded bg-slate-200" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-40 rounded-[10px] border border-border bg-white" />)}
        </div>
        <div className="mt-8 h-80 rounded-[10px] border border-border bg-white" />
      </div>
    </div>
  );
}
