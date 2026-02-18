import { CreateNoteInput, Note, UpdateNoteInput } from "@tenant-notes/shared";
import { NotFoundError } from "../types/errors";
import { NoteRepository } from "../repositories/noteRepository";

export class NoteService {
  constructor(private readonly repository: NoteRepository) {}

  list(tenantId: string): Promise<Note[]> {
    return this.repository.list(tenantId);
  }

  create(tenantId: string, userId: string, input: CreateNoteInput): Promise<Note> {
    return this.repository.create(tenantId, userId, input);
  }

  async update(tenantId: string, id: string, input: UpdateNoteInput): Promise<Note> {
    const note = await this.repository.update(tenantId, id, input);
    if (!note) {
      throw new NotFoundError("Note not found for tenant");
    }
    return note;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(tenantId, id);
    if (!deleted) {
      throw new NotFoundError("Note not found for tenant");
    }
  }
}
