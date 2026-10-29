"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveArticle } from "@/app/admin/editor/actions";
import { categories } from "@/lib/categories";
import type { ArticleRecord } from "@/lib/article-types";

const inputClass = "w-full rounded-[8px] border border-border bg-white px-4 py-3 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";
const inputFields = [
  { name: "title", label: "Title", maxLength: 180, type: "text" },
  { name: "slug", label: "URL name", maxLength: 100, type: "text" },
  { name: "author_name", label: "Author name", maxLength: 100, type: "text" },
  { name: "source_url", label: "Source URL (optional)", maxLength: 2048, type: "url" },
] as const;

export default function ArticleEditor({ article }: { article: ArticleRecord | null }) {
  const [state, formAction, pending] = useActionState(saveArticle, { error: "" });
  const [values, setValues] = useState({
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    summary: article?.summary ?? "",
    body: article?.body ?? "",
    category: article?.category ?? "",
    author_name: article?.author_name ?? "",
    source_url: article?.source_url ?? "",
  });

  function change(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={article?.id ?? ""} />

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {state.error}
        </p>
      )}

      <fieldset disabled={pending} className="space-y-6 disabled:opacity-70">
        {inputFields.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="mb-2 block text-sm font-medium">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              value={values[field.name]}
              onChange={(event) => change(field.name, event.target.value)}
              maxLength={field.maxLength}
              required={field.name === "title" || field.name === "slug"}
              readOnly={field.name === "slug" && Boolean(article)}
              placeholder={field.name === "slug" ? "my-first-story" : undefined}
              className={inputClass}
            />
            {field.name === "slug" && (
              <p className="mt-2 text-xs text-muted">
                Lowercase letters, numbers and hyphens. This stays fixed after the first save.
              </p>
            )}
          </div>
        ))}

        <div>
          <label htmlFor="category" className="mb-2 block text-sm font-medium">Category</label>
          <select
            id="category"
            name="category"
            value={values.category}
            onChange={(event) => change("category", event.target.value)}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Choose a category
            </option>

            {categories.map((category) => (
              <option key={category.slug} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="summary" className="mb-2 block text-sm font-medium">Summary</label>
          <textarea
            id="summary" name="summary" rows={3} maxLength={320}
            value={values.summary}
            onChange={(event) => change("summary", event.target.value)}
            className={inputClass}
          />
          <p className="mt-2 text-xs text-muted">20–320 characters when publishing.</p>
        </div>

        <div>
          <label htmlFor="body" className="mb-2 block text-sm font-medium">Article</label>
          <textarea
            id="body" name="body" rows={16} maxLength={100000}
            value={values.body}
            onChange={(event) => change("body", event.target.value)}
            className={inputClass + " leading-8"}
          />
          <p className="mt-2 text-xs text-muted">
            Write plain text, separating paragraphs with a blank line.
          </p>
        </div>

        {article?.status === "published" && (
          <p className="rounded-xl bg-soft p-4 text-sm text-muted">
            Save Draft removes this article from the public website.
            Publish saves your changes and keeps it public.
          </p>
        )}

        <div className="flex flex-wrap gap-4">
          <button type="submit" name="intent" value="draft"
            className="rounded-xl border border-border px-6 py-3 font-medium hover:bg-soft">
            Save Draft
          </button>
          <button type="submit" name="intent" value="publish"
            className="rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-blue-700">
            {article?.status === "published" ? "Update published article" : "Publish"}
          </button>
          <Link href="/admin" className="self-center text-sm text-muted hover:text-brand">
            Back to articles
          </Link>
        </div>
      </fieldset>

      <p role="status" className="text-sm text-muted">
        {pending ? "Saving your article…" : "Changes are saved only when you choose a button."}
      </p>
    </form>
  );
}
