import { TenantRole } from "@tenant-notes/shared";

export interface ParsedToken {
  tenantId: string;
  userId: string;
  roles: TenantRole[];
}

export function parseToken(token: string): ParsedToken | null {
  if (!token) {
    return null;
  }
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    const tenantId = (payload.tenantId ?? payload.tid ?? payload.tenant_id) as string | undefined;
    const userId = (payload.oid ?? payload.sub) as string | undefined;
    const rawRoles = payload.roles ?? payload.role;
    const roles = Array.isArray(rawRoles) ? (rawRoles as TenantRole[]) : rawRoles ? [rawRoles as TenantRole] : [];

    if (!tenantId || !userId || roles.length === 0) {
      return null;
    }
    return { tenantId, userId, roles };
  } catch {
    return null;
  }
}
