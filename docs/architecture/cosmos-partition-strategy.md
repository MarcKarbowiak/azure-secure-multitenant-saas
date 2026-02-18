# Cosmos Partition Strategy

The `Notes` container uses partition key `/tenantId`.

## Why `/tenantId`

- Guarantees tenant locality for reads and writes.
- Makes accidental cross-tenant scans less likely when repository APIs require tenant key.
- Aligns request authorization and storage partition boundaries.

## Query Pattern

- Every query includes both:
  - Partition key option (`partitionKey: tenantId`)
  - Filter predicate (`WHERE c.tenantId = @tenantId`)

This dual filter is defensive and intentional.

## Tradeoffs

- Very large tenants may require additional sub-partitioning strategy in future revisions.
- For this reference, one tenant per logical partition aligns with isolation goals.

