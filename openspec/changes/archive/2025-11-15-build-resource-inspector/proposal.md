# Change: Build Resource Inspector

## Why
The new Navigation V2 exposes a Resources group that promises a “Raw Kubernetes Explorer.” Today those links point to placeholders because the existing pages (e.g., `/pods`) were designed for SRE Mission Control’s workflow and do not deliver a kubectl-like, complete view. We need dedicated `/resources/<kind>` experiences that surface the full metadata/spec/status/events/yaml breakdown without interfering with Mission Control layouts.

## What Changes
- Ship `/resources/<kind>` routes (starting with Pods, Deployments, Nodes) that render a two-pane layout: table on the left, inspector panel on the right (drawer on mobile).
- Inspector content mirrors `kubectl describe`: Summary row, Metadata (labels/annotations/owners), Spec (Tier 1/2 fields per resource kind), Status (phase/conditions/container/current state), Events (server-side filtered via `fieldSelector`), and YAML.
- Resource tables adopt the `kubectl get -o wide` mindset with namespace/status filters plus name search; label/field selectors are explicitly deferred.
- Domain layer returns raw Kubernetes objects plus view-model helpers so the UI can render Tier 1/2 fields without losing access to the full manifest.
- Mission Control routes remain untouched; Resources navigation points exclusively to the new pages and highlights “Raw Kubernetes Explorer.”
- Phase 1 scope covers Pods, Deployments, and Nodes; subsequent kinds follow Phase 1.5+ sequencing.

## Impact
- **Affected Specs**: `console-ui` (add Resource Inspector requirements)
- **Affected Areas**: sidebar routing for `/resources/*`, new app routes, resource tables/inspector components, domain-k8s helpers, SSOT documentation for Resources philosophy.
- **Risk**: Low runtime risk; main complexity is ensuring the inspector surfaces appropriate fields and the events API can filter efficiently.

## Future Phases
This table outlines the planned, sequential rollout for subsequent resource kinds to provide a clear roadmap.

| Phase | Resources | Status |
| :--- | :--- | :--- |
| 1.0 | Pods, Deployments, Nodes | In Progress |
| 1.5 | Services, ConfigMaps, Secrets | Planned |
| 2.0 | PersistentVolumeClaims, PersistentVolumes, StatefulSets, DaemonSets | Planned |
