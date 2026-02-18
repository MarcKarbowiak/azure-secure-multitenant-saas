import { randomUUID } from "node:crypto";

export function resolveCorrelationId(headers: Record<string, string | undefined>): string {
  const correlationId = headers["x-correlation-id"];
  return correlationId && correlationId.trim().length > 0 ? correlationId : randomUUID();
}

