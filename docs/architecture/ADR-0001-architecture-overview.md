# ADR-0001: Secure Multi-Tenant Azure SaaS Reference

- Date: 2026-02-18
- Status: Accepted

## Context

This repository demonstrates a production-style, multi-tenant SaaS reference architecture with strict tenant isolation and zero-secrets operation on Azure.

## Decision

1. Use React + TypeScript (Vite) for a minimal tenant-aware web frontend.
2. Use Azure Functions (Node.js + TypeScript) as the backend API surface.
3. Use Cosmos DB SQL API with partition key `/tenantId` for tenant data isolation at storage boundaries.
4. Use Managed Identity + RBAC for Cosmos DB, Storage, and Key Vault access.
5. Enforce private networking through VNet integration, private endpoints, and private DNS.
6. Include an observability baseline using OpenTelemetry and Application Insights.
7. Provide Docker Compose local mode with in-memory repository as default fallback.

## Consequences

- Tenant boundary enforcement is implemented in API auth middleware and repository query patterns.
- No connection strings are used for Cosmos, Storage, or Key Vault access.
- Infrastructure footprint is realistic and secure, but more complex than a public-network sample.
- Local development remains simple by defaulting to in-memory mode when Azure resources are unavailable.

