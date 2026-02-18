import { describe, expect, it } from "vitest";
import { assertRole } from "../src/middleware/authGuard";
import { resolveTenantContext } from "../src/middleware/tenantContext";
import { InMemoryNoteRepository } from "../src/repositories/inMemoryNoteRepository";
import { ForbiddenError, UnauthorizedError } from "../src/types/errors";

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function jwt(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const encodedPayload = base64url(JSON.stringify(payload));
  return `${header}.${encodedPayload}.`;
}

describe("tenant isolation", () => {
  it("rejects cross-tenant note update and delete", async () => {
    const repository = new InMemoryNoteRepository();
    const created = await repository.create("tenant-a", "user-a", { title: "A", content: "A note" });

    const tenantBUpdate = await repository.update("tenant-b", created.id, { title: "hijack" });
    const tenantBDelete = await repository.delete("tenant-b", created.id);
    const tenantAList = await repository.list("tenant-a");
    const tenantBList = await repository.list("tenant-b");

    expect(tenantBUpdate).toBeNull();
    expect(tenantBDelete).toBe(false);
    expect(tenantAList).toHaveLength(1);
    expect(tenantBList).toHaveLength(0);
  });
});

describe("auth and context", () => {
  it("extracts tenant context from JWT claims", () => {
    const token = jwt({
      tid: "tenant-a",
      oid: "user-a",
      roles: ["Contributor"]
    });

    const context = resolveTenantContext(
      {
        authorization: `Bearer ${token}`
      },
      "corr-1"
    );

    expect(context.principal.tenantId).toBe("tenant-a");
    expect(context.principal.userId).toBe("user-a");
    expect(context.principal.roles).toContain("Contributor");
  });

  it("fails without tenant claim", () => {
    const token = jwt({
      oid: "user-a",
      roles: ["Reader"]
    });

    expect(() =>
      resolveTenantContext(
        {
          authorization: `Bearer ${token}`
        },
        "corr-2"
      )
    ).toThrow(UnauthorizedError);
  });

  it("blocks requests when role is not allowed", () => {
    expect(() => assertRole(["Reader"], ["Contributor", "Admin"])).toThrow(ForbiddenError);
  });
});
