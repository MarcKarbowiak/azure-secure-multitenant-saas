import { logger } from "../services/logger";
import { CosmosNoteRepository } from "./cosmosNoteRepository";
import { InMemoryNoteRepository } from "./inMemoryNoteRepository";
import { NoteRepository } from "./noteRepository";

let repository: NoteRepository | undefined;

export function resolveRepository(): NoteRepository {
  if (repository) {
    return repository;
  }

  const mode = process.env.REPOSITORY_MODE?.toLowerCase() ?? "memory";
  if (mode === "cosmos") {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const databaseId = process.env.COSMOS_DATABASE_ID ?? "TenantNotes";
    const containerId = process.env.COSMOS_CONTAINER_ID ?? "Notes";

    if (!endpoint) {
      throw new Error("COSMOS_ENDPOINT is required when REPOSITORY_MODE=cosmos");
    }

    repository = new CosmosNoteRepository(endpoint, databaseId, containerId);
    logger.info("Using Cosmos note repository", { mode, endpoint, databaseId, containerId });
    return repository;
  }

  repository = new InMemoryNoteRepository();
  logger.info("Using in-memory note repository", { mode: "memory" });
  return repository;
}

