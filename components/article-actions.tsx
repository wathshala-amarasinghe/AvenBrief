"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function ArticleActions({ slug, title }: { slug: string; title: string }) {
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSaved(JSON.parse(localStorage.getItem(`avenbrief:bookmark:${slug}`) ?? "false")), 0);
    return () => window.clearTimeout(timer);
  }, [slug]);

  async function share() {
    try {
      const url = window.location.href;
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setNotice("Link copied"); }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice("Sharing is unavailable in this browser");
    }
  }

  function bookmark() {
    const next = !saved;
    localStorage.setItem(`avenbrief:bookmark:${slug}`, JSON.stringify(next));
    setSaved(next);
    setNotice(next ? "Saved on this device" : "Removed from saved stories");
  }

  return (
    <div className="relative flex gap-3 md:flex-col">
      <button type="button" onClick={share} aria-label="Share article" className="grid h-11 w-11 place-items-center rounded-full border border-border hover:bg-soft focus-visible:outline-2 focus-visible:outline-brand"><Image src="/figma/share.svg" alt="" width={18} height={18} /></button>
      <button type="button" onClick={bookmark} aria-label={saved ? "Remove bookmark" : "Bookmark article"} aria-pressed={saved} className={`grid h-11 w-11 place-items-center rounded-full border hover:bg-soft focus-visible:outline-2 focus-visible:outline-brand ${saved ? "border-brand bg-soft" : "border-border"}`}><Image src="/figma/bookmark.svg" alt="" width={18} height={18} /></button>
      {notice && <span role="status" className="absolute left-0 top-14 z-10 whitespace-nowrap rounded bg-ink px-3 py-2 text-xs text-white md:left-14 md:top-0">{notice}</span>}
    </div>
  );
}
