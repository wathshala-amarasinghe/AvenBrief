const secretPatterns = [
  [/Bearer\s+[^\s"']+/gi, "Bearer [redacted]"],
  [/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+\b/g, "[redacted-supabase-key]"],
  [/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted-token]"],
  [/([?&](?:key|password|secret|token)=)[^&\s]+/gi, "$1[redacted]"],
];

export function sanitiseErrorMessage(value) {
  let message = value instanceof Error ? value.message : String(value);
  for (const [pattern, replacement] of secretPatterns) {
    message = message.replace(pattern, replacement);
  }
  return message.slice(0, 1000);
}

export function safeRequestPath(value) {
  return String(value).split("?", 1)[0].slice(0, 300);
}
