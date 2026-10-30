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

function Navigation({ current }: { current: string }) {
  return <>{links.map((link) => {
    const active = current === link.href || (link.href !== "/admin" && current.startsWith(link.href));
    return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-[8px] px-3 py-3 text-sm ${active ? "bg-soft font-medium text-brand" : "text-muted hover:bg-soft hover:text-ink"}`}><Image src={link.icon} alt="" width={18} height={18} /><span>{link.label}</span></Link>;
  })}</>;
}

export default function AdminShell({ children, current, email }: { children: ReactNode; current: string; email?: string | null }) {
  return (
    <div className="admin-shell min-h-screen bg-[#f7f9fc] text-ink md:grid md:grid-cols-[224px_minmax(0,1fr)]">
      <header className="border-b border-border bg-white px-5 py-4 md:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="View AvenBrief website"><Image src="/avenbrief-logo.png" alt="AvenBrief" width={124} height={34} className="h-auto w-[112px]" priority /></Link>
          <details className="group relative"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-[8px] border border-border px-3 py-2 text-sm font-medium"><Image src="/figma/menu.svg" alt="" width={17} height={17} /> Menu</summary><div className="absolute right-0 z-50 mt-3 w-64 rounded-[10px] border border-border bg-white p-3 shadow-xl"><nav aria-label="Admin navigation" className="grid gap-1"><Navigation current={current} /></nav><div className="mt-3 border-t border-border pt-3">{email && <p className="truncate px-3 text-xs text-muted">{email}</p>}<form action={signOut}><button type="submit" className="mt-2 w-full rounded-[8px] px-3 py-2 text-left text-sm text-muted hover:bg-soft hover:text-brand">Sign out</button></form></div></div></details>
        </div>
      </header>

      <aside className="relative hidden border-r border-border bg-white md:sticky md:top-0 md:block md:h-screen">
        <div className="px-6 py-5"><Link href="/" aria-label="View AvenBrief website"><Image src="/avenbrief-logo.png" alt="AvenBrief" width={134} height={35} className="h-auto w-[124px]" priority /></Link><span className="mt-2 inline-block rounded-full bg-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand">Admin</span></div>
        <nav aria-label="Admin navigation" className="space-y-1 px-3"><Navigation current={current} /></nav>
        <div className="absolute bottom-5 w-[224px] px-5">{email && <p className="truncate text-xs text-muted">{email}</p>}<form action={signOut}><button type="submit" className="mt-3 text-sm text-muted hover:text-brand">Sign out</button></form></div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
