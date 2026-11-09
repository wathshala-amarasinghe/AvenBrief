"use client";

import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = {
  children: string;
  confirmation: string;
  pendingText?: string;
  destructive?: boolean;
};

export default function ConfirmSubmitButton({
  children,
  confirmation,
  pendingText = "Updating…",
  destructive = false,
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmation)) event.preventDefault();
      }}
      className={`rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
        destructive
          ? "bg-red-600 text-white hover:bg-red-700"
          : "border border-border bg-white text-ink hover:bg-soft"
      }`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
