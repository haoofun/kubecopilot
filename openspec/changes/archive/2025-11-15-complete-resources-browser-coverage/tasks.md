## 1. Spec Alignment
- [x] 1.1 Update the `console-ui` spec with the Resources coverage matrix (per category kinds, columns, filters, default sort) and inspector composition requirements (sections, data sources, fallbacks).

## 2. Shared Page Factory
- [x] 2.1 Create a `ResourcePageConfig` schema + helpers describing columns, filters, relations, and inspector sections for a resource kind.
- [x] 2.2 Build a `ResourcesPageFactory` component that consumes the config, wires pagination/filter/search state, and renders the shared list + inspector layout defined in the spec.

## 3. Workloads Coverage
- [x] 3.1 Implement config + inspectors for StatefulSets, DaemonSets, Jobs, and CronJobs, ensuring workload-specific columns (desired/current, ready pods, restart counts) and relation chips render.

## 4. Networking Coverage
- [x] 4.1 Implement Services and Ingresses pages with health/status indicators (type, clusterIP, hosts, backend pods) plus event surfacing.

## 5. Config & Storage Coverage
- [x] 5.1 Implement ConfigMaps, Secrets (metadata-only, no value leakage), and PersistentVolumeClaims, ensuring storage status and volume bindings display correctly.

## 6. Cluster Coverage
- [x] 6.1 Implement Namespace and Node parity updates so filters, status chips, quota indicators, and inspector sections match the new spec (Nodes already close; focus on Namespaces + shared telemetry cards).

## 7. Validation
- [x] 7.1 Smoke-test every `/resources/<kind>` route on desktop + mobile for pagination, filters, inspector sections, and relation navigation.
- [x] 7.2 Run `npm run lint` and update docs/screenshots referenced by SSOT as needed.
