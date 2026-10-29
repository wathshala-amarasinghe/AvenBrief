import Form from "next/form";
import Link from "next/link";
import Image from "next/image";

export default function NewsSearch({ query = "" }: { query?: string }) {
  return (
    <Form action="/search" role="search" className="mt-7">
      <label htmlFor="news-search" className="sr-only">Search stories</label>
      <div className="flex items-center rounded-[10px] bg-soft px-4 py-1 focus-within:ring-2 focus-within:ring-brand">
        <Image src="/figma/search.svg" alt="" width={20} height={20} />
        <input
          key={query}
          id="news-search"
          name="q"
          type="search"
          defaultValue={query}
          maxLength={120}
          placeholder="Search stories, topics, and places"
          className="min-w-0 flex-1 bg-transparent px-3 py-4 text-sm text-ink outline-none placeholder:text-muted"
        />
        <button type="submit"
          className="rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-blue-700">
          Search
        </button>
      </div>
      {query && <Link href="/search" className="mt-3 inline-block text-sm text-brand hover:underline">Clear search</Link>}
    </Form>
  );
}
