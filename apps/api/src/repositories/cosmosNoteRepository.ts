import { randomUUID } from "node:crypto";
import { CosmosClient } from "@azure/cosmos";
import { ManagedIdentityCredential } from "@azure/identity";
import { CreateNoteInput, Note, UpdateNoteInput } from "@tenant-notes/shared";
import { NoteRepository } from "./noteRepository";

export class CosmosNoteRepository implements NoteRepository {
  private readonly client: CosmosClient;
  private readonly databaseId: string;
  private readonly containerId: string;

  constructor(endpoint: string, databaseId: string, containerId: string) {
    this.client = new CosmosClient({
      endpoint,
      aadCredentials: new ManagedIdentityCredential()
    });
    this.databaseId = databaseId;
    this.containerId = containerId;
  }

  async list(tenantId: string): Promise<Note[]> {
    const container = this.getContainer();
    const querySpec = {
      query: "SELECT * FROM c WHERE c.tenantId = @tenantId",
      parameters: [{ name: "@tenantId", value: tenantId }]
    };

    const { resources } = await container.items.query<Note>(querySpec, {
      partitionKey: tenantId
    }).fetchAll();

    return resources;
  }

  async create(tenantId: string, ownerId: string, input: CreateNoteInput): Promise<Note> {
    const container = this.getContainer();
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

    await container.items.create(note, { partitionKey: tenantId });
    return note;
  }

  async update(tenantId: string, id: string, input: UpdateNoteInput): Promise<Note | null> {
    const container = this.getContainer();
    const item = container.item(id, tenantId);

    try {
      const { resource } = await item.read<Note>();
      if (!resource || resource.tenantId !== tenantId) {
        return null;
      }

      const updated: Note = {
        ...resource,
        title: input.title ?? resource.title,
        content: input.content ?? resource.content,
        updatedAt: new Date().toISOString()
      };

      await item.replace(updated);
      return updated;
    } catch (error: unknown) {
      const statusCode = (error as { code?: number }).code;
      if (statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const container = this.getContainer();
    const item = container.item(id, tenantId);
    try {
      await item.delete();
      return true;
    } catch (error: unknown) {
      const statusCode = (error as { code?: number }).code;
      if (statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  private getContainer() {
    return this.client.database(this.databaseId).container(this.containerId);
  }
}

