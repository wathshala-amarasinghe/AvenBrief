import SiteHeader from "@/components/site-header";

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-white text-ink" aria-busy="true" aria-live="polite">
      <SiteHeader />
      <main className="mx-auto max-w-328 animate-pulse px-6 pb-12 pt-8 md:px-8 xl:px-0">
        <span className="sr-only">Loading category stories…</span>
        <section className="border-b border-border pb-8 md:pb-10">
          <div className="h-3 w-20 rounded bg-blue-100" />
          <div className="mt-5 grid items-end gap-5 md:grid-cols-[1fr_420px]">
            <div className="h-14 w-64 rounded bg-slate-100" />
            <div className="space-y-3"><div className="h-4 rounded bg-slate-100" /><div className="h-4 w-4/5 rounded bg-slate-100" /></div>
          </div>
        </section>
        <section className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
          {[0, 1, 2, 3, 4, 5].map((item) => <div key={item}><div className="aspect-[16/10] rounded-[10px] bg-slate-100" /><div className="mt-4 h-3 w-20 rounded bg-blue-100" /><div className="mt-3 h-6 rounded bg-slate-100" /><div className="mt-2 h-6 w-4/5 rounded bg-slate-100" /></div>)}
        </section>
      </main>
    </div>
  );
}
