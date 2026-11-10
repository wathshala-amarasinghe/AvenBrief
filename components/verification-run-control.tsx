"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

type VerificationRunControlProps = {
  action: (formData: FormData) => void | Promise<void>;
  articleId: string;
  disabled: boolean;
  hasReport: boolean;
  status: "running" | "completed" | "failed" | null;
};

function VerificationSubmitButton({ disabled, hasReport }: Pick<VerificationRunControlProps, "disabled" | "hasReport">) {
  const { pending } = useFormStatus();

  return (
    <div className="text-right">
      <button
        type="submit"
        disabled={disabled || pending}
        aria-describedby={pending ? "verification-progress" : undefined}
        className="rounded-[8px] bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Checking source…" : hasReport ? "Run verification again" : "Run automated verification"}
      </button>
      {pending && (
        <p id="verification-progress" role="status" className="mt-2 max-w-64 text-xs leading-5 text-muted">
          Verification can take a minute. Keep this page open; the result will appear automatically.
        </p>
      )}
    </div>
  );
}

export default function VerificationRunControl({
  action,
  articleId,
  disabled,
  hasReport,
  status,
}: VerificationRunControlProps) {
  const router = useRouter();

  useEffect(() => {
    if (status !== "running") return;

    const interval = window.setInterval(() => {
      router.refresh();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [router, status]);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={articleId} />
      <VerificationSubmitButton disabled={disabled || status === "running"} hasReport={hasReport} />
      {status === "running" && (
        <p role="status" className="mt-2 max-w-64 text-right text-xs leading-5 text-muted">
          Verification is processing. This page checks for the result automatically.
        </p>
      )}
    </form>
  );
}
