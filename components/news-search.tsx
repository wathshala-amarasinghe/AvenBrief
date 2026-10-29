import Form from "next/form";
import Link from "next/link";

export default function NewsSearch({ query = "" }: { query?: string }) {
  return (
    <Form action="/search" role="search" className="mt-8 max-w-2xl">
      <label htmlFor="news-search" className="mb-3 block text-sm font-medium">
        Search by title, summary, or category
      </label>
      <div className="flex flex-wrap gap-3">
        <input
          key={query}
          id="news-search"
          name="q"
          type="search"
          defaultValue={query}
          maxLength={120}
          placeholder="Try artificial intelligence or technology"
          className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-3 text-ink placeholder:text-muted"
        />
        <button type="submit"
          className="rounded-xl bg-brand px-5 py-3 font-medium text-white hover:bg-blue-700">
          Search
        </button>
        {query && (
          <Link href="/search" className="rounded-xl bg-soft px-5 py-3 font-medium text-brand hover:bg-blue-100">
            Clear
          </Link>
        )}
      </div>
    </Form>
  );
}
