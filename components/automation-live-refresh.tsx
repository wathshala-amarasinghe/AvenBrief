"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AutomationLiveRefreshProps = {
  active: boolean;
};

export default function AutomationLiveRefresh({ active }: AutomationLiveRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = window.setInterval(refresh, 3000);

    return () => window.clearInterval(interval);
  }, [active, router]);

  if (!active) return null;

  return (
    <p role="status" className="mt-2 text-xs text-amber-800">
      Live updates are on. This page will show the result automatically.
    </p>
  );
}
