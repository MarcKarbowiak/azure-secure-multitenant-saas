import cors from "cors";
import express, { Request } from "express";
import { createNote, deleteNote, getNotes, healthCheck, updateNote } from "../http/notesHandlers";
import { initTelemetry } from "../telemetry/initTelemetry";

initTelemetry();

const app = express();
app.use(cors());
app.use(express.json());

function mapHeaders(request: Request): Record<string, string | undefined> {
  const headers: Record<string, string | undefined> = {};
  Object.entries(request.headers).forEach(([key, value]) => {
    headers[key] = Array.isArray(value) ? value.join(",") : value;
  });
  return headers;
}

app.get("/api/notes", async (req, res) => {
  const response = await getNotes({ method: "GET", headers: mapHeaders(req), params: {} });
  res.status(response.status).set(response.headers ?? {}).json(response.body);
});

app.post("/api/notes", async (req, res) => {
  const response = await createNote({ method: "POST", headers: mapHeaders(req), params: {}, body: req.body });
  res.status(response.status).set(response.headers ?? {}).json(response.body);
});

app.put("/api/notes/:id", async (req, res) => {
  const response = await updateNote({
    method: "PUT",
    headers: mapHeaders(req),
    params: { id: req.params.id },
    body: req.body
  });
  res.status(response.status).set(response.headers ?? {}).json(response.body);
});

app.delete("/api/notes/:id", async (req, res) => {
  const response = await deleteNote({
    method: "DELETE",
    headers: mapHeaders(req),
    params: { id: req.params.id }
  });
  if (response.status === 204) {
    res.status(204).set(response.headers ?? {}).send();
    return;
  }
  res.status(response.status).set(response.headers ?? {}).json(response.body);
});

app.get("/api/health", async (req, res) => {
  const response = await healthCheck({
    method: "GET",
    headers: mapHeaders(req),
    params: {}
  });
  res.status(response.status).set(response.headers ?? {}).json(response.body);
});

const port = Number(process.env.PORT ?? 7071);
app.listen(port, () => {
  console.log(JSON.stringify({ level: "INFO", message: "Local API server started", port }));
});

