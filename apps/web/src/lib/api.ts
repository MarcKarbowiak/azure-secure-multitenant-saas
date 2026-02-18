import { Note } from "@tenant-notes/shared";

export interface ApiClient {
  listNotes(): Promise<Note[]>;
  createNote(title: string, content: string): Promise<Note>;
  deleteNote(id: string): Promise<void>;
}

export function createApiClient(baseUrl: string, jwt: string): ApiClient {
  async function request(path: string, init?: RequestInit): Promise<Response> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${jwt}`,
        ...(init?.headers ?? {})
      }
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? `Request failed: ${response.status}`);
    }
    return response;
  }

  return {
    async listNotes() {
      const response = await request("/notes");
      const payload = (await response.json()) as { notes: Note[] };
      return payload.notes;
    },
    async createNote(title: string, content: string) {
      const response = await request("/notes", {
        method: "POST",
        body: JSON.stringify({ title, content })
      });
      const payload = (await response.json()) as { note: Note };
      return payload.note;
    },
    async deleteNote(id: string) {
      await request(`/notes/${id}`, { method: "DELETE" });
    }
  };
}

