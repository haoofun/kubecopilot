# Change: Complete Resources Browser Coverage

## Why
- The Resources navigation tree still points to numerous placeholder routes (StatefulSets, DaemonSets, Jobs, Services, ConfigMaps, Secrets, PVCs, Namespaces, etc.) that either render the Pods table or display empty shells. SREs cannot rely on `/resources/*` for day-to-day work because the list/inspector pairs are only finished for Pods/Deployments/Nodes.
- Current specs describe the layout shell but never define the minimum dataset per resource kind (columns, filters, default sort, inspector sections). Each page is implemented ad-hoc, so status chips, YAML tabs, relations, and events data vary wildly or are missing altogether.
- Without a coverage contract, it is impossible to know when Resources pages are “done.” Mission Control keeps evolving, yet the supposedly authoritative Raw Explorer lags behind, creating duplicate troubleshooting paths and confusing telemetry in SSOT Phase 3.

## What Changes
- Declare a coverage matrix for the Resources browser that enumerates every required route under Workloads, Networking, Config & Storage, and Cluster, along with the critical data each view MUST expose (columns, filters, and indicators).
- Standardize inspector composition for every kind: Summary, Related Resources (chips), Status & Conditions, Referenced Manifests, Recent Events, and YAML. Call out which sections may be hidden (e.g., Services lack “Spec vs Status” deltas) so the UI behaves predictably.
- Introduce a shared `ResourcePageConfig` definition so new pages can be scaffolded declaratively (columns, filters, row actions, inspector sections) and wired through a `ResourcesPageFactory` component.
- Deliver first-class implementations for the remaining priority kinds (StatefulSet, DaemonSet, Job, CronJob, ReplicaSet, Service, Ingress, EndpointSlice, ConfigMap, Secret, PersistentVolumeClaim, Namespace) using the factory plus the existing list/inspector primitives.
- Document the above inside the `console-ui` spec so future contributors know how to add new resource kinds without regressing layout or navigation behavior.

## Impact
- **Specs**: `console-ui` gains requirements that spell out the coverage matrix and inspector composition rules for all `/resources/<kind>` pages.
- **Code**: `src/app/(dashboard)/resources/*`, `src/components/resources/page-factory.tsx`, resource-specific columns/inspectors, and supporting hooks.
- **Risk**: Medium. Adds many new resource kinds, so list fetching and inspector hydration need careful pagination/state handling to avoid regressions.
