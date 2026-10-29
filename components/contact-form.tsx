"use client";

import { useState } from "react";

export default function ContactForm({ email }: { email?: string }) {
  const [notice, setNotice] = useState("");

  function submit(formData: FormData) {
    if (!email) {
      setNotice("A public contact email is still being configured. Please use the project repository for now.");
      return;
    }
    const subject = String(formData.get("subject") || "AvenBrief reader message");
    const name = String(formData.get("name") || "Reader");
    const replyTo = String(formData.get("replyTo") || "");
    const message = String(formData.get("message") || "");
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${name}\nReply email: ${replyTo}\n\n${message}`)}`;
    setNotice("Your email app should open with a new message. Nothing was sent automatically.");
  }

  const fieldClass = "mt-2 w-full rounded-[8px] border border-border bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";

  return (
    <form action={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">Name<input name="name" required maxLength={100} className={fieldClass} /></label>
        <label className="text-sm font-medium">Email<input name="replyTo" type="email" required maxLength={254} className={fieldClass} /></label>
      </div>
      <label className="block text-sm font-medium">Subject
        <select name="subject" className={fieldClass} defaultValue="General question">
          <option>General question</option><option>Correction request</option><option>Source or rights concern</option><option>Collaboration</option>
        </select>
      </label>
      <label className="block text-sm font-medium">Message<textarea name="message" required rows={6} maxLength={4000} className={fieldClass} /></label>
      <button type="submit" className="rounded-[8px] bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-blue-700">Prepare email</button>
      {notice && <p role="status" className="text-sm leading-6 text-muted">{notice}</p>}
    </form>
  );
}
