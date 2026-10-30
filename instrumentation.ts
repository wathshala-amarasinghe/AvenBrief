import type { Instrumentation } from "next";
import { safeRequestPath, sanitiseErrorMessage } from "@/lib/error-reporting.mjs";

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const record = typeof error === "object" && error !== null ? error as { digest?: unknown; name?: unknown } : null;

  console.error(JSON.stringify({
    event: "request_error",
    errorName: typeof record?.name === "string" ? record.name : "UnknownError",
    message: sanitiseErrorMessage(error),
    digest: record?.digest === undefined ? undefined : String(record.digest).slice(0, 200),
    method: request.method,
    path: safeRequestPath(request.path),
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
  }));
};
