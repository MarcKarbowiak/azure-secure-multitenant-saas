import { TenantRole } from "@tenant-notes/shared";
import { ForbiddenError } from "../types/errors";

export function assertRole(userRoles: TenantRole[], allowedRoles: TenantRole[]): void {
  const authorized = userRoles.some((role) => allowedRoles.includes(role));
  if (!authorized) {
    throw new ForbiddenError("Insufficient role");
  }
}

