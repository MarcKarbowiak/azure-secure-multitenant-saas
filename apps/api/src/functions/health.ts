import { app, HttpRequest } from "@azure/functions";
import { healthCheck } from "../http/notesHandlers";

function normalizeHeaders(request: HttpRequest): Record<string, string | undefined> {
  const headers: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

app.http("health", {
  route: "health",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request: HttpRequest) => {
    const response = await healthCheck({
      method: "GET",
      headers: normalizeHeaders(request),
      params: {}
    });
    return { status: response.status, headers: response.headers, jsonBody: response.body };
  }
});

