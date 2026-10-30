"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { saveArticle } from "@/app/admin/editor/actions";
import { uploadArticleImage } from "@/app/admin/editor/image-actions";
import { categories } from "@/lib/categories";
import type { ArticleRecord } from "@/lib/article-types";

const inputClass = "w-full rounded-[8px] border border-border bg-white px-4 py-3 text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export default function ArticleEditor({
  article,
  defaultAuthor = "AvenBrief Editorial Team",
}: {
  article: ArticleRecord | null;
  defaultAuthor?: string;
}) {
  const [state, formAction, pending] = useActionState(saveArticle, { error: "" });
  const [uploadState, setUploadState] = useState({
    error: "",
    url: "",
  });
  const [uploadPending, startUploadTransition] = useTransition();
  const slugTouched = useRef(Boolean(article));
  const uploadInput = useRef<HTMLInputElement>(null);
  const [dirty, setDirty] = useState(false);
  const [values, setValues] = useState({
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    summary: article?.summary ?? "",
    body: article?.body ?? "",
    category: article?.category ?? "",
    author_name: article?.author_name ?? defaultAuthor,
    source_url: article?.source_url ?? "",
    featured_image_url: article?.featured_image_url ?? "",
    image_alt: article?.image_alt ?? "",
    image_credit: article?.image_credit ?? "",
  });

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty && !pending && !uploadPending) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, pending, uploadPending]);

  function change(name: keyof typeof values, value: string) {
    setDirty(true);
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (name === "title" && !slugTouched.current && !article) {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  function handleImageUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startUploadTransition(async () => {
      const result = await uploadArticleImage(uploadState, formData);
      setUploadState(result);
      if (result.url) {
        setValues((current) => ({ ...current, featured_image_url: result.url }));
        setDirty(true);
        if (uploadInput.current) uploadInput.current.value = "";
      }
    });
  }

  const wordCount = values.body.trim() ? values.body.trim().split(/\s+/).length : 0;

  return (
    <>
      <form id="article-form" action={formAction} className="space-y-6">
        <input type="hidden" name="id" value={article?.id ?? ""} />
        {state.error && (
          <p role="alert" className="rounded-[10px] bg-red-50 p-4 text-red-700">
            {state.error}
          </p>
        )}

        <fieldset disabled={pending} className="grid gap-8 disabled:opacity-70 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="space-y-5">
            <label className="block text-sm font-medium">
              Title
              <input name="title" value={values.title} onChange={(event) => change("title", event.target.value)} required maxLength={180} className={`${inputClass} mt-2`} />
              <span className="mt-1 block text-right text-xs text-muted">{values.title.length}/180</span>
            </label>

            <label className="block text-sm font-medium">
              URL name
              <input
                name="slug"
                value={values.slug}
                onChange={(event) => {
                  slugTouched.current = true;
                  change("slug", event.target.value);
                }}
                readOnly={Boolean(article)}
                required
                maxLength={100}
                className={`${inputClass} mt-2`}
              />
              <span className="mt-1 block text-xs text-muted">Generated from the title. It locks after the first save.</span>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Author
                <input name="author_name" value={values.author_name} onChange={(event) => change("author_name", event.target.value)} maxLength={100} className={`${inputClass} mt-2`} />
              </label>
              <label className="block text-sm font-medium">
                Category
                <select name="category" value={values.category} onChange={(event) => change("category", event.target.value)} required className={`${inputClass} mt-2`}>
                  <option value="" disabled>Choose a category</option>
                  {categories.map((category) => <option key={category.slug} value={category.name}>{category.name}</option>)}
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium">
              Original source URL
              <input name="source_url" type="url" value={values.source_url} onChange={(event) => change("source_url", event.target.value)} maxLength={2048} className={`${inputClass} mt-2`} />
            </label>

            <section className="rounded-[10px] bg-soft p-4" aria-labelledby="featured-image-heading">
              <h2 id="featured-image-heading" className="font-medium">Featured image</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="image-file" className="block text-sm font-medium">Upload image</label>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      ref={uploadInput}
                      id="image-file"
                      name="image_file"
                      type="file"
                      form="image-upload-form"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploadPending}
                      className="min-w-0 flex-1 rounded-[8px] border border-border bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-soft file:px-3 file:py-2 file:text-ink"
                    />
                    <button
                      type="submit"
                      form="image-upload-form"
                      formNoValidate
                      disabled={uploadPending}
                      className="rounded-[8px] border border-border bg-white px-4 py-3 text-sm font-medium hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      {uploadPending ? "Uploading…" : "Upload"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted">JPEG, PNG, WebP, or GIF. Maximum 5 MB.</p>
                  {uploadState.error && <p role="alert" className="mt-2 text-sm text-red-700">{uploadState.error}</p>}
                  {uploadState.url && <p role="status" className="mt-2 text-sm text-green-700">Upload complete. Save the article to keep this image.</p>}
                </div>

                <label className="block text-sm font-medium">
                  Featured image URL
                  <input name="featured_image_url" type="url" value={values.featured_image_url} onChange={(event) => change("featured_image_url", event.target.value)} maxLength={2048} placeholder="Upload an image or paste an HTTPS URL" className={`${inputClass} mt-2`} />
                </label>
                <label className="block text-sm font-medium">
                  Alternative text
                  <input name="image_alt" value={values.image_alt} onChange={(event) => change("image_alt", event.target.value)} maxLength={300} className={`${inputClass} mt-2`} />
                </label>
                <label className="block text-sm font-medium">
                  Image credit
                  <input name="image_credit" value={values.image_credit} onChange={(event) => change("image_credit", event.target.value)} maxLength={300} className={`${inputClass} mt-2`} />
                </label>
              </div>
            </section>

            <label className="block text-sm font-medium">
              Summary
              <textarea name="summary" rows={4} maxLength={320} value={values.summary} onChange={(event) => change("summary", event.target.value)} className={`${inputClass} mt-2`} />
              <span className="mt-1 block text-right text-xs text-muted">{values.summary.length}/320 · minimum 20 to publish</span>
            </label>

            <label className="block text-sm font-medium">
              Article
              <textarea name="body" rows={18} maxLength={100000} value={values.body} onChange={(event) => change("body", event.target.value)} className={`${inputClass} mt-2 leading-8`} />
              <span className="mt-1 block text-right text-xs text-muted">{values.body.length.toLocaleString()} characters · {wordCount} words</span>
            </label>
          </div>

          <aside className="h-fit rounded-[10px] border border-border bg-soft p-5 lg:sticky lg:top-6" aria-label="Article preview">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-xl font-semibold">Live preview</h2>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] text-muted">{article?.status ?? "draft"}</span>
            </div>
            {values.featured_image_url && (
              <div className="mt-5 aspect-video overflow-hidden rounded-[8px] bg-white">
                <img src={values.featured_image_url} alt={values.image_alt || "Featured image preview"} className="h-full w-full object-cover" />
              </div>
            )}
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-brand">{values.category || "Category"}</p>
            <h3 className="mt-2 font-serif text-3xl font-semibold leading-tight">{values.title || "Your headline will appear here"}</h3>
            <p className="mt-4 text-sm leading-6 text-muted">{values.summary || "Add a concise summary to preview the story introduction."}</p>
            <p className="mt-4 text-xs text-muted">{values.author_name || "Author"} · {Math.max(1, Math.ceil(wordCount / 220))} min read</p>
            <div className="mt-6 border-t border-border pt-5 text-sm leading-7 text-ink">
              {values.body ? values.body.split(/\n\s*\n/).slice(0, 3).map((paragraph, index) => <p key={index} className="mb-3">{paragraph}</p>) : <p className="text-muted">Article preview will appear as you write.</p>}
            </div>
          </aside>

          <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-white/95 px-4 py-4 backdrop-blur lg:col-span-2">
            <button type="submit" name="intent" value="draft" className="rounded-[8px] border border-border px-6 py-3 font-medium hover:bg-soft">Save draft</button>
            <button type="submit" name="intent" value="publish" className="rounded-[8px] bg-brand px-6 py-3 font-medium text-white hover:bg-blue-700">{article?.status === "published" ? "Update published article" : "Publish"}</button>
            <Link href="/admin" className="text-sm text-muted hover:text-brand">Back to articles</Link>
            <span role="status" className="ml-auto text-xs text-muted">{pending ? "Saving…" : uploadPending ? "Uploading…" : dirty ? "Unsaved changes" : "All changes saved"}</span>
          </div>
        </fieldset>
      </form>
      <form id="image-upload-form" onSubmit={handleImageUpload} />
    </>
  );
}
