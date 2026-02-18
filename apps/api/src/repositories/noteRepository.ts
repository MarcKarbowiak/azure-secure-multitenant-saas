import { CreateNoteInput, Note, UpdateNoteInput } from "@tenant-notes/shared";

export interface NoteRepository {
  list(tenantId: string): Promise<Note[]>;
  create(tenantId: string, ownerId: string, input: CreateNoteInput): Promise<Note>;
  update(tenantId: string, id: string, input: UpdateNoteInput): Promise<Note | null>;
  delete(tenantId: string, id: string): Promise<boolean>;
}

