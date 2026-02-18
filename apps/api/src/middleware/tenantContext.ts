import { AuthPrincipal, TenantContext, TenantRole } from "@tenant-notes/shared";
import { UnauthorizedError } from "../types/errors";

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new UnauthorizedError("Invalid JWT format");
  }

  try {
    const payload = parts[1];
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(normalized, "base64").toString("utf8");
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    throw new UnauthorizedError("Invalid JWT payload");
  }
}

function parseRoles(claims: Record<string, unknown>): TenantRole[] {
  const rawRoles = claims.roles ?? claims.role;
  if (Array.isArray(rawRoles)) {
    return rawRoles.filter((value): value is TenantRole =>
      value === "Reader" || value === "Contributor" || value === "Admin"
    );
  }
  if (typeof rawRoles === "string" && (rawRoles === "Reader" || rawRoles === "Contributor" || rawRoles === "Admin")) {
    return [rawRoles];
  }
  return [];
}

function parsePrincipal(claims: Record<string, unknown>): AuthPrincipal {
  const tenantId = (claims.tenantId ?? claims.tid ?? claims.tenant_id) as string | undefined;
  const userId = (claims.oid ?? claims.sub) as string | undefined;
  const roles = parseRoles(claims);

  if (!tenantId || !userId) {
    throw new UnauthorizedError("JWT missing tenant or user claim");
  }
  if (roles.length === 0) {
    throw new UnauthorizedError("JWT missing role claim");
  }

  return { tenantId, userId, roles };
}

export function resolveTenantContext(
  headers: Record<string, string | undefined>,
  correlationId: string
): TenantContext {
  const authorization = headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new UnauthorizedError("Bearer token is required");
  }

  const token = authorization.slice("Bearer ".length);
  const claims = decodeJwtPayload(token);
  const principal = parsePrincipal(claims);
  return { principal, correlationId };
}
