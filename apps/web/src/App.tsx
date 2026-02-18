import { useMemo, useState } from "react";
import { Note } from "@tenant-notes/shared";
import { createApiClient } from "./lib/api";
import { parseToken } from "./lib/jwt";

function defaultDevToken(): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ tid: "tenant-a", oid: "user-a", roles: ["Contributor"] }));
  return `${header}.${payload}.`;
}

export function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7071/api");
  const [jwt, setJwt] = useState(defaultDevToken());
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const parsed = useMemo(() => parseToken(jwt), [jwt]);

  const client = useMemo(() => createApiClient(apiBaseUrl, jwt), [apiBaseUrl, jwt]);

  async function loadNotes(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const result = await client.listNotes();
      setNotes(result);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function create(): Promise<void> {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await client.createNote(title, content);
      setTitle("");
      setContent("");
      await loadNotes();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      await client.deleteNote(id);
      await loadNotes();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="layout">
      <section className="panel">
        <h1>Tenant Notes</h1>
        <p className="meta">
          Tenant: <strong>{parsed?.tenantId ?? "invalid token"}</strong> | Roles:{" "}
          <strong>{parsed?.roles.join(", ") ?? "none"}</strong>
        </p>

        <label>
          API base URL
          <input value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} />
        </label>

        <label>
          JWT
          <textarea value={jwt} onChange={(event) => setJwt(event.target.value)} rows={5} />
        </label>

        <div className="row">
          <button disabled={loading || !parsed} onClick={loadNotes}>
            Refresh notes
          </button>
          <label className="flag">
            <input type="checkbox" disabled />
            Feature flag (placeholder)
          </label>
        </div>

        <div className="create">
          <input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <textarea
            placeholder="Content"
            value={content}
            rows={3}
            onChange={(event) => setContent(event.target.value)}
          />
          <button disabled={loading || !parsed} onClick={create}>
            Create note
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <ul className="notes">
          {notes.map((note) => (
            <li key={note.id}>
              <strong>{note.title}</strong>
              <p>{note.content}</p>
              <small>{new Date(note.updatedAt).toLocaleString()}</small>
              <button disabled={loading} onClick={() => remove(note.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

