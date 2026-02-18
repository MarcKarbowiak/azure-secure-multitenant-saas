import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { createNote, deleteNote, getNotes, updateNote } from "../http/notesHandlers";

function normalizeHeaders(request: HttpRequest): Record<string, string | undefined> {
  const headers: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

async function toHttpResponse(responsePromise: Promise<{
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}>): Promise<HttpResponseInit> {
  const response = await responsePromise;
  return {
    status: response.status,
    headers: response.headers,
    jsonBody: response.body
  };
}

app.http("notes-get", {
  route: "notes",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request: HttpRequest, _context: InvocationContext) =>
    toHttpResponse(getNotes({ method: "GET", headers: normalizeHeaders(request), params: request.params }))
});

app.http("notes-post", {
  route: "notes",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request: HttpRequest) =>
    toHttpResponse(createNote({ method: "POST", headers: normalizeHeaders(request), params: request.params, body: await request.json() }))
});

app.http("notes-put", {
  route: "notes/{id}",
  methods: ["PUT"],
  authLevel: "anonymous",
  handler: async (request: HttpRequest) =>
    toHttpResponse(updateNote({ method: "PUT", headers: normalizeHeaders(request), params: request.params, body: await request.json() }))
});

app.http("notes-delete", {
  route: "notes/{id}",
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: async (request: HttpRequest) =>
    toHttpResponse(deleteNote({ method: "DELETE", headers: normalizeHeaders(request), params: request.params }))
});

