import SiteHeader from "@/components/site-header";

export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-white text-ink" aria-busy="true" aria-live="polite">
      <SiteHeader />
      <main className="mx-auto max-w-[1312px] animate-pulse px-6 pb-14 pt-8 md:px-8 md:pt-12 xl:px-0">
        <span className="sr-only">Loading article…</span>
        <div className="mx-auto max-w-[980px] text-center">
          <div className="mx-auto h-3 w-24 rounded bg-blue-100" />
          <div className="mx-auto mt-6 h-12 max-w-3xl rounded bg-slate-100 md:h-16" />
          <div className="mx-auto mt-4 h-12 max-w-2xl rounded bg-slate-100" />
          <div className="mx-auto mt-6 h-5 w-72 rounded bg-slate-100" />
        </div>
        <div className="mt-10 aspect-[16/9] rounded-[10px] bg-slate-100 md:mt-12 md:aspect-[16/7.8]" />
        <div className="mx-auto mt-10 max-w-[680px] space-y-4">
          {[100, 92, 96, 72, 98, 88].map((width) => <div key={width} className="h-4 rounded bg-slate-100" style={{ width: `${width}%` }} />)}
        </div>
      </main>
    </div>
  );
}
