# Core API Service (Stub)

This directory is a placeholder for the future standalone Core API process
described in SSOT Phase 2. It reuses the shared domain packages under
`packages/domain-k8s` so that we can migrate the Next.js BFF into its own
service without rewriting Kubernetes access logic.

Key principles:
- keep HTTP/transport adapters here
- depend only on domain packages + infra utilities
- share DTOs/contracts with the Next.js console via the same packages
