export type TenantRole = "Reader" | "Contributor" | "Admin";

export interface AuthPrincipal {
  userId: string;
  tenantId: string;
  roles: TenantRole[];
}

export interface Note {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}

export interface TenantContext {
  principal: AuthPrincipal;
  correlationId: string;
}
