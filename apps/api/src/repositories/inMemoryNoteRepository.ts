import { randomUUID } from "node:crypto";
import { CreateNoteInput, Note, UpdateNoteInput } from "@tenant-notes/shared";
import { NoteRepository } from "./noteRepository";

type TenantStore = Map<string, Note>;

export class InMemoryNoteRepository implements NoteRepository {
  private readonly store: Map<string, TenantStore> = new Map();

  async list(tenantId: string): Promise<Note[]> {
    const tenantNotes = this.store.get(tenantId);
    return tenantNotes ? Array.from(tenantNotes.values()) : [];
  }

  async create(tenantId: string, ownerId: string, input: CreateNoteInput): Promise<Note> {
    const now = new Date().toISOString();
    const note: Note = {
      id: randomUUID(),
      tenantId,
      ownerId,
      title: input.title,
      content: input.content,
      createdAt: now,
      updatedAt: now
    };

    const tenantNotes = this.getOrCreateTenantStore(tenantId);
    tenantNotes.set(note.id, note);
    return note;
  }

  async update(tenantId: string, id: string, input: UpdateNoteInput): Promise<Note | null> {
    const tenantNotes = this.store.get(tenantId);
    if (!tenantNotes) {
      return null;
    }

    const existing = tenantNotes.get(id);
    if (!existing) {
      return null;
    }

    const updated: Note = {
      ...existing,
      title: input.title ?? existing.title,
      content: input.content ?? existing.content,
      updatedAt: new Date().toISOString()
    };
    tenantNotes.set(id, updated);
    return updated;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const tenantNotes = this.store.get(tenantId);
    if (!tenantNotes) {
      return false;
    }
    return tenantNotes.delete(id);
  }

  private getOrCreateTenantStore(tenantId: string): TenantStore {
    let tenantNotes = this.store.get(tenantId);
    if (!tenantNotes) {
      tenantNotes = new Map<string, Note>();
      this.store.set(tenantId, tenantNotes);
    }
    return tenantNotes;
  }
}

