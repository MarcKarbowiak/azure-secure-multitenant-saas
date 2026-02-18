import { SpanStatusCode, trace } from "@opentelemetry/api";

export async function withSpan<T>(
  spanName: string,
  attributes: Record<string, string>,
  operation: () => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer("tenant-notes-api");
  return tracer.startActiveSpan(spanName, async (span) => {
    Object.entries(attributes).forEach(([key, value]) => span.setAttribute(key, value));
    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

