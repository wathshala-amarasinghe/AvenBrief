"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: ReactNode;
  pendingText?: string;
  secondary?: boolean;
};

export default function SubmitButton({
  children,
  pendingText = "Saving…",
  secondary = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  const style = secondary
    ? "border border-border text-ink hover:bg-soft"
    : "bg-brand text-white hover:bg-blue-700";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-50 ${style}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}