# Observability Baseline

The API includes a baseline telemetry design for production troubleshooting.

## Implemented Signals

- OpenTelemetry instrumentation with Azure Monitor exporter.
- Structured JSON logs for app and audit events.
- Correlation IDs (`x-correlation-id`) generated or propagated per request.
- Health endpoint: `GET /api/health`.

## Audit Log Shape

Each note operation emits machine-readable audit data including:

- action
- tenantId
- userId
- noteId (if applicable)
- correlationId
- result

## Operations Guidance

- Route logs and traces to Application Insights workspace.
- Alert on repeated authorization failures and unexpected 5xx rates.
- Include `correlationId` in incident triage to trace request path end-to-end.

