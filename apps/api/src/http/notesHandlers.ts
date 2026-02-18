import { CreateNoteInput, TenantRole, UpdateNoteInput } from "@tenant-notes/shared";
import { assertRole } from "../middleware/authGuard";
import { resolveCorrelationId } from "../middleware/correlation";
import { resolveTenantContext } from "../middleware/tenantContext";
import { resolveRepository } from "../repositories/repositoryFactory";
import { logger } from "../services/logger";
import { NoteService } from "../services/noteService";
import { BadRequestError, HttpError } from "../types/errors";
import { RequestEnvelope, ResponseEnvelope } from "../types/http";
import { withSpan } from "../telemetry/tracing";

const noteService = new NoteService(resolveRepository());

function normalizeHeaders(headers: Record<string, string | undefined>): Record<string, string | undefined> {
  const normalized: Record<string, string | undefined> = {};
  Object.entries(headers).forEach(([key, value]) => {
    normalized[key.toLowerCase()] = value;
  });
  return normalized;
}

function successResponse(status: number, correlationId: string, body?: unknown): ResponseEnvelope {
  return {
    status,
    headers: {
      "content-type": "application/json",
      "x-correlation-id": correlationId
    },
    body
  };
}

function errorResponse(error: unknown, correlationId: string): ResponseEnvelope {
  const typedError = error instanceof HttpError ? error : new HttpError(500, "Internal Server Error");
  if (!(error instanceof HttpError)) {
    logger.error("Unhandled request failure", { correlationId, error: String(error) });
  }

  return successResponse(typedError.statusCode, correlationId, {
    error: typedError.message,
    correlationId
  });
}

function parseCreateInput(body: unknown): CreateNoteInput {
  const typed = body as Partial<CreateNoteInput> | undefined;
  if (!typed?.title || !typed.content) {
    throw new BadRequestError("title and content are required");
  }
  const title = typed.title.trim();
  const content = typed.content.trim();
  if (!title || !content) {
    throw new BadRequestError("title and content are required");
  }
  return { title, content };
}

function parseUpdateInput(body: unknown): UpdateNoteInput {
  const typed = body as Partial<UpdateNoteInput> | undefined;
  if (!typed || (typed.title === undefined && typed.content === undefined)) {
    throw new BadRequestError("title or content must be supplied");
  }
  const title = typed.title?.trim();
  const content = typed.content?.trim();
  if (typed.title !== undefined && !title) {
    throw new BadRequestError("title cannot be empty");
  }
  if (typed.content !== undefined && !content) {
    throw new BadRequestError("content cannot be empty");
  }
  return { title, content };
}

function verifyRole(contextRoles: TenantRole[], allowedRoles: TenantRole[]): void {
  assertRole(contextRoles, allowedRoles);
}

export async function getNotes(request: RequestEnvelope): Promise<ResponseEnvelope> {
  const headers = normalizeHeaders(request.headers);
  const correlationId = resolveCorrelationId(headers);

  try {
    return await withSpan("notes.get", { correlationId }, async () => {
      const context = resolveTenantContext(headers, correlationId);
      verifyRole(context.principal.roles, ["Reader", "Contributor", "Admin"]);

      const notes = await noteService.list(context.principal.tenantId);
      logger.audit({
        action: "notes.list",
        tenantId: context.principal.tenantId,
        userId: context.principal.userId,
        correlationId,
        result: "success"
      });
      return successResponse(200, correlationId, { notes });
    });
  } catch (error) {
    return errorResponse(error, correlationId);
  }
}

export async function createNote(request: RequestEnvelope): Promise<ResponseEnvelope> {
  const headers = normalizeHeaders(request.headers);
  const correlationId = resolveCorrelationId(headers);

  try {
    return await withSpan("notes.create", { correlationId }, async () => {
      const context = resolveTenantContext(headers, correlationId);
      verifyRole(context.principal.roles, ["Contributor", "Admin"]);

      const input = parseCreateInput(request.body);
      const note = await noteService.create(context.principal.tenantId, context.principal.userId, input);

      logger.audit({
        action: "notes.create",
        tenantId: context.principal.tenantId,
        userId: context.principal.userId,
        noteId: note.id,
        correlationId,
        result: "success"
      });

      return successResponse(201, correlationId, { note });
    });
  } catch (error) {
    return errorResponse(error, correlationId);
  }
}

export async function updateNote(request: RequestEnvelope): Promise<ResponseEnvelope> {
  const headers = normalizeHeaders(request.headers);
  const correlationId = resolveCorrelationId(headers);

  try {
    return await withSpan("notes.update", { correlationId }, async () => {
      const context = resolveTenantContext(headers, correlationId);
      verifyRole(context.principal.roles, ["Contributor", "Admin"]);
      const id = request.params.id;
      if (!id) {
        throw new BadRequestError("id is required");
      }

      const input = parseUpdateInput(request.body);
      const note = await noteService.update(context.principal.tenantId, id, input);

      logger.audit({
        action: "notes.update",
        tenantId: context.principal.tenantId,
        userId: context.principal.userId,
        noteId: id,
        correlationId,
        result: "success"
      });

      return successResponse(200, correlationId, { note });
    });
  } catch (error) {
    return errorResponse(error, correlationId);
  }
}

export async function deleteNote(request: RequestEnvelope): Promise<ResponseEnvelope> {
  const headers = normalizeHeaders(request.headers);
  const correlationId = resolveCorrelationId(headers);

  try {
    return await withSpan("notes.delete", { correlationId }, async () => {
      const context = resolveTenantContext(headers, correlationId);
      verifyRole(context.principal.roles, ["Contributor", "Admin"]);
      const id = request.params.id;
      if (!id) {
        throw new BadRequestError("id is required");
      }

      await noteService.delete(context.principal.tenantId, id);
      logger.audit({
        action: "notes.delete",
        tenantId: context.principal.tenantId,
        userId: context.principal.userId,
        noteId: id,
        correlationId,
        result: "success"
      });

      return successResponse(204, correlationId);
    });
  } catch (error) {
    return errorResponse(error, correlationId);
  }
}

export async function healthCheck(request: RequestEnvelope): Promise<ResponseEnvelope> {
  const headers = normalizeHeaders(request.headers);
  const correlationId = resolveCorrelationId(headers);

  return successResponse(200, correlationId, {
    status: "ok",
    timestamp: new Date().toISOString()
  });
}
