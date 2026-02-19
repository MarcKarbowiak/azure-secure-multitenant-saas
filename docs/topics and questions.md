Repository Interview Question Bank
1. Architecture & System Design
The repository claims “hard tenant isolation” enforced across identity, authorization, repository, and storage. Which layer is the actual security boundary you trust, and which are “defense-in-depth” only? How would you prove that boundary holds under code change?
In this design, tenant identity is derived from JWT claims in-process (see tenantContext.ts). What are the explicit trust assumptions about upstream components, and how are those assumptions enforced in production (not just documented)?
Why choose Azure Functions for a tenant-isolated CRUD API rather than App Service / Container Apps / AKS? Discuss cold start, scale-out behavior, and operational control tradeoffs specific to this repo’s patterns.
The Function HTTP triggers are configured with authLevel: "anonymous" (see notes.ts). Describe the intended production ingress architecture (e.g., APIM, Front Door, EasyAuth) and the failure mode if that layer is misconfigured.
Cosmos DB is used with partition key /tenantId (see main.bicep and cosmos-partition-strategy.md). Why is “one tenant = one logical partition” acceptable here, and what is your concrete plan when a tenant’s data or throughput exceeds the logical partition limits?
The repository enforces WHERE c.tenantId = @tenantId and also uses partitionKey: tenantId (see cosmosNoteRepository.ts). What specific risks does the “dual filter” mitigate, and which risks does it not mitigate?
The API appears to be tenant-isolated but not owner-isolated (a Note has ownerId, but list/update/delete are tenant-scoped) (see index.ts, noteService.ts). What is the intended authorization model: tenant-wide visibility, owner-only, or role-based subsets? How would you evolve this without breaking isolation guarantees?
Explain how private networking is intended to work end-to-end: Functions VNet integration → private endpoints → private DNS zones (see main.bicep, networking-private-endpoints.md). What’s your debugging playbook when Cosmos becomes unreachable?
This design provisions both system-assigned and user-assigned managed identities on the Function App (see main.bicep). Which identity is supposed to be used for Cosmos, Storage, and Key Vault—and how do you ensure the runtime actually uses the intended one?
Describe the boundary between “application-level isolation” and “platform-level isolation.” If a developer accidentally removes a tenant filter in code, what controls still prevent cross-tenant access?
The repo provides an in-memory repository mode and a Cosmos mode (see repositoryFactory.ts). What is the architectural intent of this abstraction—testability only, portability, or resilience? What are the risks of the abstraction masking production-only behaviors?
If you had to support multi-region active-active, what changes would you make to: Cosmos configuration, identity, request routing, and consistency expectations?
If the API becomes multi-tenant across multiple Entra tenants (true SaaS), how do you handle issuer validation, tenant discovery, and “bring-your-own-tenant” onboarding while maintaining “zero secrets”?
What are your data retention and deletion requirements per tenant (GDPR/DSAR)? Where would you implement and audit tenant offboarding so that it is verifiably complete?
The architecture provisions Key Vault but the app code doesn’t appear to consume it. What is the intended secret/config story, and why is Key Vault present in the reference at this stage?
What is the threat model for tenant isolation? Enumerate at least: confused deputy, token substitution, partition key injection/mismatch, IDOR across tenants, and operational misconfiguration.
How would you design “break-glass” support access to tenant data while keeping strong auditability and minimizing blast radius?
2. Technology & Tooling Choices
Why OpenTelemetry + Azure Monitor exporter (see initTelemetry.ts) instead of native Application Insights SDK for Node? What do you gain/lose in sampling control, correlation, and semantic conventions?
The API uses @azure/cosmos with AAD credentials (see cosmosNoteRepository.ts). Why AAD over keys (beyond “zero secrets”), and what operational complexity does this introduce (token acquisition, identity selection, RBAC scope management)?
Why store authorization in roles claims and only allow three fixed roles? How do you handle enterprise realities like groups, scp, app roles vs delegated permissions, and role changes without token refresh?
Why Vite dev server in a Docker container for the “web” service (see Dockerfile.web) rather than building static assets and serving via CDN/Static Web Apps? What is the intended production hosting model?
Why choose Elastic Premium EP1 for Functions by default (see main.bicep)? Justify the cost/perf tradeoff vs Consumption plan, and the constraints imposed by VNet + private endpoints.
Why are Log Analytics ingestion/query set to public network enabled (see main.bicep) while other resources are publicNetworkAccess: 'Disabled'? Is this a deliberate tradeoff or an inconsistency?
Why use vitest for backend tests (see package.json) rather than Jest or node:test? What’s your reasoning around ecosystem maturity, mocking patterns, and CI integration (given there is no CI config here)?
Why implement a custom request envelope (RequestEnvelope) and handler normalization rather than directly using Azure Functions request objects everywhere (see http.ts, notes.ts)?
The repo includes Docker Compose with optional Cosmos Emulator (see docker-compose.yml). Why not make Cosmos emulator the default dev path if Cosmos is the production store?
The frontend includes a “feature flag placeholder” (see App.tsx). What feature-flag system would you actually adopt (App Configuration, LaunchDarkly, custom), and how would you keep it tenant-scoped and auditable?
Why keep both JavaScript and TypeScript entrypoints in the web folder (e.g., App.js exists alongside TS/TSX in the workspace structure)? Is this transitional or intentional?
What is your dependency and versioning strategy across workspaces (see root package.json)? How do you prevent “silent drift” in a multi-package repo?
3. Code Structure & Implementation Patterns
Walk through the request path for POST /api/notes: from HTTP trigger → handler → middleware → service → repository. Where are the invariants enforced, and where could a refactor accidentally bypass them (see notesHandlers.ts)?
In tenantContext.ts, JWT signature verification is not performed. What exact controls must exist upstream for this to be safe, and how would you make that safety testable (not tribal knowledge)?
The JWT payload decoding logic differs between backend and frontend implementations (see tenantContext.ts and jwt.ts). What risks does this create (parsing edge cases, claim mapping divergence), and how would you de-duplicate or align semantics?
The repository factory memoizes a singleton repository in a module-level variable (see repositoryFactory.ts). In Azure Functions’ execution model, what are the concurrency/lifecycle implications? How do you prevent cross-test pollution or hidden state issues?
The API returns structured error payloads and includes correlationId (see notesHandlers.ts). What is your policy for error-message disclosure, and how do you ensure internal errors aren’t leaking through String(error) or future error types?
parseCreateInput and parseUpdateInput perform minimal validation (see notesHandlers.ts). What validation rules are missing for production (sizes, encoding, content scanning, HTML injection, abusive payloads), and where should validation live?
In Cosmos update flow, you read then replace without ETag concurrency control (see cosmosNoteRepository.ts). What are the consequences under concurrent writes, and how would you implement optimistic concurrency safely?
list() uses .fetchAll() (see cosmosNoteRepository.ts). What’s your pagination strategy, and how do you prevent a single tenant from causing large RU spikes or timeouts?
The withSpan helper sets span attributes from string-only records (see tracing.ts). How would you extend this to include request metrics, status codes, and error categories without creating cardinality explosions?
The logger is console.log(JSON.stringify(...)) (see logger.ts). How do you plan to handle log levels, PII redaction, schema versioning, and ingestion cost controls?
The API normalizes headers to lowercase, but the Azure Functions trigger normalization uses original keys first (see notes.ts and notesHandlers.ts). Are there any subtle header-casing issues that could break auth/correlation propagation?
Why are healthCheck and note CRUD handlers in the same module (see notesHandlers.ts)? How would you structure larger APIs to preserve tenant boundary invariants across multiple resources?
4. DevSecOps & Supply Chain Controls
There are no GitHub Actions workflows present. What is your CI baseline for: build, test, lint, IaC validation, and security scanning—and why is it absent here?
What’s your dependency scanning approach for npm workspaces (SCA), including transitive dependencies, and how do you enforce upgrades without breaking runtime compatibility?
Do you commit node_modules (it exists in the workspace root listing)? If not, how do you ensure it is excluded and not accidentally packaged into artifacts?
How would you implement secret scanning and prevent accidental leakage, given this repo’s “zero secrets” stance still includes potential env vars and connection strings (e.g., App Insights connection string)?
For Bicep, what checks do you run in CI: bicep build, what-if, policy compliance, and drift detection? How do you gate production deployment?
Explain how you would enforce “private endpoint required” and “public network disabled” as policy, not convention (Azure Policy, initiative assignments, exceptions).
The deploy script runs az deployment group create directly (see deploy.ps1). How do you handle: least-privileged deploy identities, approvals, and audit trails for infrastructure changes?
What is your container supply chain story (SBOM, image signing, base image pinning)? The Dockerfiles use node:20-alpine floating tags (see Dockerfile.api, Dockerfile.web)—what’s the risk?
How do you manage environment configuration securely (dev/test/prod) without secrets, including identity selection (user-assigned MI client IDs) and endpoint configuration?
How do you handle vulnerability remediation SLAs and ownership? Who is on the hook when a new Node CVE drops?
Where is your threat model artifact, and how do you keep it current as the code evolves?
What’s your approach to “tenant-aware audit logs” as a compliance artifact: retention, immutability, and access control?
5. Reliability & Testing Strategy
Tests currently validate tenant-boundary behavior and middleware logic (see tenantBoundary.test.ts). What are the highest-risk behaviors not covered by tests?
How would you add integration tests that validate Cosmos tenant isolation using the emulator profile (see docker-compose.yml)—and what emulator-vs-cloud gaps would still remain?
How would you test that private endpoints and private DNS are correctly wired, given these failures are common and subtle? What can be validated pre-deploy vs post-deploy?
What is your retry/backoff strategy for Cosmos 429s and transient errors? Where should it live (SDK config vs application logic)?
How do you handle partial failures: write succeeds but audit log emission fails; telemetry exporter is down; downstream storage is throttled?
What is the API’s idempotency strategy for POST /notes? How would you prevent duplicate note creation under client retries/timeouts?
What are your SLOs (latency, availability) for each endpoint, and how do you derive alert thresholds from them?
How do you validate that x-correlation-id is propagated across services (web → API → Cosmos telemetry) and remains stable for a request?
What’s your plan for chaos testing: DNS failures, MI token acquisition failures, Cosmos regional failover, and cold-start storms?
The API currently treats “note not found” as 404 even across tenants (see noteService.ts). Is this intentional to avoid tenant enumeration? Are there other enumeration vectors?
How would you test role-based access systematically across all operations and roles, including negative tests and edge claims?
6. Observability & Telemetry
Telemetry initialization is conditional on APPLICATIONINSIGHTS_CONNECTION_STRING (see initTelemetry.ts). What’s your production stance: fail-open (no telemetry) or fail-closed? Why?
What span/trace structure do you expect for a PUT /notes/{id} request, and how do you ensure it includes tenant-safe context (no PII, no sensitive content)?
The audit log uses eventType: "audit" with INFO level (see logger.ts). How do you separate audit logs from application logs operationally (routing, retention, access control)?
Where do you record authorization failures and suspicious activity? What queries/alerts would you build in Application Insights or Log Analytics?
How do you prevent cardinality blowups if you add tenantId/userId attributes to spans/logs at scale? What’s your policy for high-cardinality fields?
How do you correlate a single user action across frontend and backend? What headers and trace propagation standards do you follow?
What additional signals are missing for production readiness: request duration histograms, Cosmos RU consumption, dependency failures, cold start metrics?
If a tenant reports “missing notes,” outline the exact investigative steps you would take using correlation IDs, traces, and Cosmos diagnostics.
How do you ensure that logs never capture note content (which is user data) inadvertently through error serialization or future debug logs?
7. Progressive Delivery & Deployment Model
There is IaC and a manual deploy script (see deploy.ps1), but no CI/CD. Describe your target delivery pipeline: build, test, package, infra plan, deploy, verify, rollback.
What is your rollback strategy for Functions when deploying new code: slot swaps, run-from-package versioning, canarying, or blue/green at the routing layer?
How would you implement progressive delivery safely given tenant isolation risk (a single bug can become a cross-tenant incident)?
Where would you put configuration per environment (dev/test/prod), and how do you validate config correctness before traffic is shifted?
The Function App is configured with WEBSITE_RUN_FROM_PACKAGE=1 (see main.bicep). How do you produce and publish that package artifact, and how do you ensure it is reproducible?
What are your deployment-time “smoke tests” and “post-deploy verifications” (health, auth, Cosmos connectivity, private DNS resolution)?
How would you enforce change control on the Bicep template: review gates, policy checks, and environment promotion?
How do you handle database/container schema evolution for Cosmos (indexes, TTL, throughput changes) without tenant impact?
What is your strategy for versioning the API contract to avoid breaking the web client?
For the frontend, what’s your production hosting/deploy model, given the current container runs dev mode (see Dockerfile.web)?
8. Governance & Risk (AI-specific if relevant)
The repo includes an ADR (see ADR-0001-architecture-overview.md). What decisions are missing ADRs (identity trust boundary, ingress, token validation, private networking defaults), and why?
What is your RACI for tenant isolation: who owns security invariants, who approves changes, and who gets paged for violations?
How do you document and enforce data classification for stored fields (title, content), and what compliance obligations follow?
Where is your formal threat model and abuse-case catalog? How often is it reviewed, and by whom?
Describe your audit requirements: which events are required, how long retained, who can access them, and how tamper-resistance is achieved.
What is your incident response plan for “possible cross-tenant data exposure,” including notification timelines and forensic steps?
If AI features were added (e.g., summarization of notes), how would you govern model selection, prompt/version control, data residency, and tenant data isolation in inference?
How do you ensure that the “JWT validated upstream” assumption doesn’t become a governance gap (e.g., a future deployment bypasses APIM)?
What are the policies for operational access (SRE/support) to production data, and how do you implement least privilege plus monitoring?
9. Scalability & Performance
Scenario: one tenant suddenly has 10M notes. How does GET /notes behave today, and what changes would you make (pagination, indexes, query shape, caching)?
Scenario: Cosmos throttles at peak (429s). What’s your app-level behavior, how do you surface it to clients, and how do you avoid turning throttling into an outage?
Scenario: a tenant’s partition becomes hot because they generate traffic bursts. How do you detect it, and what partitioning or workload-shaping changes do you make?
Scenario: Functions scale-out increases rapidly. What happens to Managed Identity token requests, Cosmos connection reuse, and cold starts? How would you tune client reuse and initialization?
Scenario: Private DNS is intermittently misconfigured after an infra change. What symptoms appear, and how do you differentiate DNS vs RBAC vs SDK issues?
Scenario: You add search over notes content. How would you design it without cross-tenant leakage (indexing pipeline, partitioning, access control)?
Scenario: You need per-tenant quotas (notes count, storage, RU budget). Where do you enforce quotas, and how do you make it resilient to race conditions?
Scenario: You introduce batch operations (bulk delete). How do you ensure auditability, throttling safety, and isolation across concurrent tenant operations?
Scenario: A malicious tenant sends huge payloads and high request rates. What protections exist today, and what do you add (WAF, rate limiting, request size limits, backpressure)?
Scenario: You need multi-region DR with RPO/RTO targets. What does the current infra need (Cosmos failover settings, App Insights/LA, deployment topology)?
Scenario: You decide to support hierarchical partition keys (HPK). What changes are needed in queries, SDK usage, and repository contracts?
Scenario: Compliance requires customer-managed keys (CMK) for Cosmos/Storage/Key Vault. What changes would you plan and what are the operational implications?
10. Cost & Operational Tradeoffs
Justify the baseline cost profile: Premium Functions plan (EP1), private endpoints, Log Analytics, and App Insights (see main.bicep). What would you trim for an MVP vs keep for production?
How do you estimate and control Cosmos costs (RU/s, storage growth) per tenant? What dashboards and alerts do you set up?
What is your log/trace retention strategy given ingestion costs and compliance needs (see main.bicep)?
What is the incremental cost of “private-only” networking, and how do you justify it against the threat model?
How do you prevent runaway costs from high-cardinality telemetry or verbose audit logging?
What is your approach to “chargeback/showback” per tenant and how does it influence the data model and partitioning?
If you had to cut infra cost by 50% without changing functionality, what would you change first—and what risks would you accept?
11. Consulting & Leadership Framing
Explain this architecture to a non-technical executive in 90 seconds: what risk it reduces, what it costs, and what it enables.
If a customer asks “how do you guarantee tenant isolation,” what evidence do you provide (tests, controls, audits), and what do you not claim?
Describe the top three architectural risks in this repo today and how you would communicate them to stakeholders without over-alarming.
You’re asked to productionize this in 6 weeks. What scope do you explicitly refuse, and what “must-haves” do you insist on before go-live?
A platform team says private endpoints make troubleshooting too hard. How do you respond and what compromises (if any) do you offer?
Security leadership challenges the “JWT validation upstream” model. How do you defend it, and what concrete mitigations do you add to reduce governance risk?
A tenant experiences latency spikes. Walk through your incident narrative: detection → mitigation → root cause → prevention, including what you’d report externally.
How do you organize ownership boundaries (frontend/backend/infra/security) so tenant isolation invariants aren’t “everyone’s job = nobody’s job”?
If a new engineer proposes adding a cross-tenant admin endpoint, what questions do you ask and what guardrails do you require?
What would you measure weekly to know this service is healthy (security, reliability, cost), and who reviews those metrics?
12. Hard Panel Questions
Your API decodes JWT payloads but doesn’t validate signatures (see tenantContext.ts). Explain why this is not an immediate security vulnerability in your production design—and then explain how it could become one with a single misconfiguration.
The Function App has both system-assigned and user-assigned identity, but Cosmos client construction uses ManagedIdentityCredential() without explicitly selecting the user-assigned identity (see cosmosNoteRepository.ts, main.bicep). Prove which identity is used at runtime and how you guarantee it stays correct across environments.
You claim “hard tenant isolation,” but GET /notes returns all notes for a tenant regardless of user. If a tenant admin accidentally assigns a user the wrong role, what prevents data misuse? Is this “isolation” or “access control,” and who owns it?
Show how a single code change could silently reintroduce a cross-tenant query in Cosmos. What specific code review checks, tests, or static analysis would catch it?
Your Cosmos update path reads the item and then replaces it without ETag checks. Under concurrent updates, what data corruption is possible, and how would you explain that risk to a customer?
There is no CI/CD configuration in-repo. If you were hiring a senior engineer to own this, what would you expect them to add first, and how do you justify prioritization?
Private endpoints often fail due to DNS/route issues. If you are paged at 2am because Cosmos is unreachable, what exact commands, logs, and Azure resources do you inspect first?
Your logs are JSON via stdout (see logger.ts). How do you ensure PII never leaks, especially if future engineers add debug logs of request bodies?
The frontend includes a default dev token with alg: none (see App.tsx). How do you prevent this pattern from accidentally reaching production or training engineers into unsafe token handling habits?
If a regulator asks for evidence of tenant data separation, what artifacts can you produce today from this repo alone—and what can’t you produce?
Learning Gap Signals
Must deeply understand:

Azure identity selection nuances for multi-identity workloads (system-assigned vs user-assigned) and how SDKs choose identities
Azure Functions networking with VNet integration + private endpoints + private DNS, including common failure modes
Cosmos DB partitioning limits and evolution paths (large tenants, hot partitions, HPK/sub-partitioning)
Token validation trust boundaries (where JWT is validated, how to enforce it, and how to test that enforcement)
Observability design tradeoffs (cardinality control, audit logging vs application logging, incident triage with correlation IDs)
Areas that appear weak or under-explained:

Production ingress/auth architecture that safely compensates for authLevel: "anonymous" and in-process non-validation of JWT signatures
Identity correctness guarantees for Cosmos access given user-assigned identity RBAC in IaC but unspecified selection in code
Pagination/quotas/rate limiting and RU-aware design for Cosmos at scale
Clear authorization model beyond tenant scoping (owner-level access vs tenant-wide access)
Areas that could trigger skepticism:

“Hard tenant isolation” claims without CI-enforced invariant tests, integration tests, or automated policy checks
Lack of CI/CD, security scanning, and IaC validation gates
Web container running dev server rather than a production build/serving model
Minimal test coverage focused on boundary helpers rather than end-to-end behaviors
Missing artifacts:

CI pipeline definitions (build/test/lint/IaC validation/security scans)
Threat model document and abuse-case analysis
SLOs/SLIs and alerting thresholds; runbooks for DNS/private endpoint/MI failures
Rollback and progressive delivery strategy for Functions and IaC
Integration test suite validating Cosmos + RBAC + networking assumptions in realistic environments