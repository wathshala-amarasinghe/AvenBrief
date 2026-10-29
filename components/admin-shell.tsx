import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/login/actions";

const links = [
  { href: "/admin", label: "Overview", icon: "/figma/dashboard.svg" },
  { href: "/admin/editor", label: "Articles", icon: "/figma/document.svg" },
  { href: "/admin/inbox", label: "Review queue", icon: "/figma/clock.svg" },
  { href: "/admin/sources", label: "News sources", icon: "/figma/globe.svg" },
  { href: "/admin/settings", label: "Settings", icon: "/figma/settings.svg" },
];

export default function AdminShell({ children, current, email }: { children: ReactNode; current: string; email?: string | null }) {
  return (
    <div className="admin-shell min-h-screen bg-[#f7f9fc] text-ink md:grid md:grid-cols-[224px_minmax(0,1fr)]">
      <aside className="border-b border-border bg-white md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-5 md:block md:px-6">
          <Link href="/" aria-label="AvenBrief home"><Image src="/avenbrief-logo.png" alt="AvenBrief" width={134} height={35} className="h-auto w-[124px]" priority /></Link>
          <span className="rounded-full bg-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand">Admin</span>
        </div>
        <nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto px-3 pb-4 md:block md:space-y-1 md:px-3 md:pb-0">
          {links.map((link) => {
            const active = current === link.href || (link.href !== "/admin" && current.startsWith(link.href));
            return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-[8px] px-3 py-3 text-sm ${active ? "bg-soft font-medium text-brand" : "text-muted hover:bg-soft hover:text-ink"}`}><Image src={link.icon} alt="" width={18} height={18} /><span>{link.label}</span></Link>;
          })}
        </nav>
        <div className="hidden px-5 md:absolute md:bottom-5 md:block md:w-[224px]">
          {email && <p className="truncate text-xs text-muted">{email}</p>}
          <form action={signOut}><button type="submit" className="mt-3 text-sm text-muted hover:text-brand">Sign out</button></form>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
