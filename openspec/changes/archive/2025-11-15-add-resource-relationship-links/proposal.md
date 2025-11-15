# Change: Add Resource Relationship Quick Links

## Why
- Resource inspectors currently read like static detail dumps; professional SREs have to manually search or re-run list filters to jump from a Pod to its owning Deployment/StatefulSet, PVC, or Node. This violates SSOT Phase 3 goals around interactive topology/context.
- Specs under `console-ui` never documented how "related resources" should surface, and the spec still references the retired split-view layout. Without a spec refresh, inspectors remain inconsistent and the navigation contract is unclear (selection params, namespace handling, missing targets).
- Users expect one-click pivots (e.g., from a Pod to its Deployment to the Namespace's ConfigMaps) plus visibility into relationship validity (is the owner missing?). Without clear fallback behavior, each inspector will improvise.

## What Changes
- Align the spec: remove/replace the outdated split-view requirement and document the Related Resources section, the `?selection=` + `namespace=` query contract (auto-switch namespace when needed), and the user experience when related resources are missing or stale.
- Define a Resource Relationship pattern: each inspector gains a `Related` section listing key associations (owner workload, node, services/endpoints, PVCs, ConfigMaps, Secrets, namespaces) rendered as clickable chips that navigate to `/resources/<kind>?selection=<name>&namespace=<ns>`.
- Introduce a `ResourceRelations` component + helper that derive relations from existing summary data whenever possible, while explicitly noting when a lightweight fetch is acceptable (e.g., fetching pods for a node). Provide copy-only chips/disabled states when the relation target no longer exists.
- Update Pods, Deployments, and Nodes inspectors to surface the `Related` section with actionable links. Document that this component will be reused by other resource kinds in future changes.

## Impact
- **Specs**: `console-ui` adds requirements describing the Related Resources section, query param format, namespace handling, and fallback states while removing the conflicting split-view text.
- **Code**: `src/components/resources/inspectors/*`, potential shared `ResourceRelations` component, and router helpers to preselect target rows.
- **Risk**: Low to moderate—UI-only additions with existing data. Need to ensure navigation states (query params for selection) are handled gracefully.
