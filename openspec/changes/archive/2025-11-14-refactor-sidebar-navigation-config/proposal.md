# Change: Refactor Sidebar to be Configuration-Driven

## Why
To prepare for a major sidebar redesign, this change refactors the existing sidebar to be configuration-driven. This de-risks the upcoming Information Architecture (IA) changes by separating the structural code refactoring from the IA design itself. It introduces a feature flag, allowing the new IA to be developed and tested in parallel without affecting production users, ensuring a safe and iterative rollout.

## What Changes
- **Documentation**: The current V1 navigation structure will be documented in a new section within `SSOT.md`.
- **Configuration-Driven UI**: The `Sidebar.tsx` component will be refactored to render its structure from a configuration object instead of being hardcoded.
- **V1 Config**: A `src/config/navConfigV1.ts` file will be created to represent the current navigation structure, ensuring no visual changes after the initial refactor.
- **V2 Config**: A `src/config/navConfigV2.ts` file will be created to represent the new, SRE-workflow-oriented navigation structure. Initially, all links will point to existing page URLs; net-new destinations will receive placeholder routes so no entry 404s.
- **V2 IA Details**: The V2 configuration follows five first-level groups reflecting the SRE troubleshooting journey and tooling needs:
  1. **AI Copilot** — Operation Plans, YAML Copilot, Ask the Cluster (new NLQ inspector).
  2. **SRE Mission Control** — four sub-flows (Health, App Runtime, Platform, Infra) covering Overview, Events, AI Diagnosis, workload primitives, config/storage resources, and infra primitives.
  3. **Dashboards** — Overview (shared entry rendered a second time), Node/Workload/Network/Storage dashboards for AI storytelling.
  4. **Resources** — Workloads, Networking, Config & Storage, Cluster; each sub-group expands down to the concrete Kubernetes resources (e.g., Workloads → Pods, Deployments, StatefulSets, DaemonSets, Jobs, CronJobs).
  5. **Audit** — Operation History, API Logs, Audit Events to highlight KubeCopilot's provenance value.
- **Feature Flag**: A feature flag (via a `NEXT_PUBLIC_` environment variable) will be implemented in `Sidebar.tsx` to switch between the V1 and V2 configurations. The flag defaults to the V1 config in production, while local development enables V2 by setting `NEXT_PUBLIC_ENABLE_NAV_V2=true` in `.env.local`. Documentation will call out how QA/ops can toggle it in other environments.
- **Placeholder Routes**: The following Next.js routes will be scaffolded with "🚧 Coming Soon" placeholders so every nav item has a stable URL: `/ask-cluster`, `/ai-diagnosis`, `/dashboards/cluster`, `/dashboards/workloads`, `/dashboards/network`, `/dashboards/storage`, `/audit/operations`, `/audit/events`, `/audit/api-logs`.
- **SSOT Updates**: The Navigation Architecture section will capture both V1 and V2, the placeholder-route strategy, and instructions for toggling the feature flag in each environment. Future resources (Network Policies, Storage Classes, CRDs) will be tracked in SSOT only—no disabled links appear in the UI until shipped.

## Impact
- **Affected Specs**: `console-ui`
- **Affected Code**:
  - `SSOT.md` will be updated with a new section.
  - `src/components/layout/Sidebar.tsx` will be significantly refactored.
  - New configuration files will be created under a `src/config/` directory.
- **User Impact**: None in production by default. Developers will see the new V2 navigation structure locally.
