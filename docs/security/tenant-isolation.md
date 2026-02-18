# Tenant Isolation Design

Tenant isolation is enforced in multiple layers:

1. Identity boundary: every request must include JWT claims for tenant and user identity.
2. Authorization boundary: endpoint actions require explicit role checks.
3. Data boundary: repository APIs require `tenantId`, and no unscoped reads are implemented.
4. Storage boundary: Cosmos DB container uses `/tenantId` as partition key.

## Cross-Tenant Rejection

- Update and delete require `tenantId` + `id` resolution.
- If a note ID exists in another tenant partition, it is not visible to the caller.
- Unit tests validate that tenant B cannot update/delete tenant A records.

## Why This Matters

Single-point filtering is fragile. This sample duplicates tenant enforcement in request parsing, policy checks, and data access, reducing blast radius from coding mistakes.

