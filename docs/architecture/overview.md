# Architecture Overview

The `Tenant Notes` sample uses a thin frontend and a tenant-safe API on Azure Functions. Data is stored in Cosmos DB with tenant partitioning and strict repository-level scoping.

## Core Components

- Web: React + TypeScript (Vite) app for minimal note management.
- API: Azure Functions-compatible Node + TypeScript service exposing `/notes` CRUD.
- Data: Cosmos DB SQL container with partition key `/tenantId`.
- Identity: Entra ID JWT claims + Managed Identity for Azure resource access.
- Infra: Bicep templates for app, data, networking, RBAC, and private DNS.
- Ops: OpenTelemetry traces, structured JSON logs, audit events, and health endpoint.

## Enforcement Boundaries

- JWT extraction enforces `tenantId`, `userId`, and `roles`.
- Role guard blocks unauthorized operations (`Reader`, `Contributor`, `Admin`).
- Repository methods require `tenantId` for every operation.
- Cosmos queries are explicitly filtered by tenant and scoped to tenant partition key.

