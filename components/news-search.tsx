"use client";

import { useState } from "react";
import NewsCard from "@/components/news-card";
import { articles } from "@/lib/news";

export default function NewsSearch() {
  const [query, setQuery] = useState("");
  const searchTerm = query.trim().toLowerCase();

  const results = articles.filter((article) => {
    const searchableText =
      `${article.title} ${article.category} ${article.summary}`.toLowerCase();

    return searchableText.includes(searchTerm);
  });

  return (
    <section className="mt-8">
      <div
        role="search"
        aria-label="Search articles"
        className="max-w-2xl"
      >
        <label
          htmlFor="news-search"
          className="mb-3 block text-sm font-medium"
        >
          Search by title, topic, or category
        </label>

        <div className="flex flex-wrap gap-3">
          <input
            id="news-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try energy, cities, or technology"
            className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-3 text-ink placeholder:text-muted"
          />

          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-xl bg-soft px-5 py-3 font-medium text-brand hover:bg-blue-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <p role="status" className="my-8 text-sm text-muted">
        {results.length} {results.length === 1 ? "story" : "stories"}
        {searchTerm ? ` found for “${query.trim()}”` : " available"}
      </p>

      {results.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((article) => (
            <NewsCard key={article.slug} {...article} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-soft p-8">
          <h2 className="font-serif text-2xl font-semibold">
            No stories found
          </h2>
          <p className="mt-3 text-muted">
            Try a different keyword or clear your search.
          </p>
        </div>
      )}
    </section>
  );
}