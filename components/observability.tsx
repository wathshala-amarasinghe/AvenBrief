"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";

export default function Observability() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname.startsWith("/admin")) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
