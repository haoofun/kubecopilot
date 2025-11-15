_Change cancelled per user direction; Mission Control UI remains bespoke while services/API work landed separately._

## 1. Configuration
- [x] 1.1 (Cancelled) No shared `ResourcePageConfig` introduced for Mission Control; user requested keeping bespoke layouts.
- [x] 1.2 (Cancelled) Documentation not added because the factory migration was abandoned.

## 2. Refactoring
- [x] 2.1 Cancelled—Pods page stays on the legacy layout.
- [x] 2.2 Cancelled—Deployments page stays on the legacy layout.
- [x] 2.3 Cancelled—StatefulSets page stays on the legacy layout.
- [x] 2.4 Cancelled—DaemonSets page stays on the legacy layout.
- [x] 2.5 Cancelled—Jobs page stays on the legacy layout.
- [x] 2.6 Cancelled—CronJobs page stays on the legacy layout.
- [x] 2.7 Cancelled—Platform/Infra pages (ConfigMaps, Secrets, Services, Ingresses, PVCs, PVs, Nodes, Namespaces) remain bespoke.
- [x] 2.8 Cancelled—No Mission Control embellishments moved to configs.

## 3. Spec Alignment
- [x] 3.1 Not applied; console-ui spec unchanged because the factory migration was dropped.

## 4. Validation
- [x] 4.1 Confirmed UX parity by reverting to the previous implementation.
- [x] 4.2 `npm run lint`
