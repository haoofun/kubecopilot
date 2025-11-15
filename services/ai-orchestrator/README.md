# AI Orchestrator Service (Stub)

Phase 2 introduces an isolated AI Orchestrator that will own prompt loading,
model selection, schema validation, and risk annotations. This stub verifies
that the shared prompt registry utilities can run in a standalone runtime
(e.g. serverless function or edge worker) without importing from the Next.js
app directly.

Future work:
- expose HTTP handlers / RPC endpoints
- plug into OperationPlan generation workflows
- stream audits + telemetry back to the console
