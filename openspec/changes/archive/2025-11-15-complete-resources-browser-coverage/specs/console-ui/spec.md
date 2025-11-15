## ADDED Requirements
### Requirement: Resources Coverage Matrix
Every Resources navigation entry (Workloads, Networking, Config & Storage, Cluster) SHALL route to a fully implemented `/resources/<kind>` page that uses the shared stack (filter bar → paginated list → inspector) and exposes kind-specific data, not placeholders.

#### Scenario: Workloads Coverage
- **GIVEN** the sidebar exposes Pods, Deployments, StatefulSets, DaemonSets, Jobs, CronJobs, and ReplicaSets
- **WHEN** a user opens any `/resources/<workload-kind>` route
- **THEN** the page SHALL list the canonical workload fields (namespace, desired/current/ready counts, images, controller) with filters for namespace, label selector, phase/status, and age, while the inspector surfaces Summary + Related Resources chips so SREs can jump across workloads and pods.

#### Scenario: Networking Coverage
- **GIVEN** Services, Ingresses, and EndpointSlices appear under Resources → Networking
- **WHEN** the user navigates to `/resources/services` (or the others)
- **THEN** the list SHALL show networking-specific metadata (type, ClusterIP/ports, hosts, backend count) with filters for namespace/type/status, and the inspector SHALL enumerate endpoints + routing targets, enabling direct navigation to pods/deployments.

#### Scenario: Config & Storage Coverage
- **GIVEN** ConfigMaps, Secrets, and PersistentVolumeClaims appear under Resources → Config & Storage
- **WHEN** their pages load
- **THEN** the list SHALL expose metadata-only summaries (keys count, age, storage class, capacity, binding status) with filters for namespace/labels/status, and the inspector SHALL include read-only YAML plus relation chips to workloads/volumes without leaking secret values.

#### Scenario: Cluster Coverage
- **GIVEN** Namespaces and Nodes entries live under Resources → Cluster
- **WHEN** users open `/resources/namespaces`
- **THEN** the list SHALL surface quota/status indicators, allow filtering by phase/label, and the inspector SHALL provide Summary, Status, Events, YAML, and Related Resources while auto-switching namespace filters according to selection params.

### Requirement: Inspector Composition Parity
Resource inspectors SHALL share a consistent set of sections so the experience is predictable irrespective of the resource kind.

#### Scenario: Mandatory Sections
- **GIVEN** any inspector is opened from `/resources/<kind>`
- **WHEN** data renders
- **THEN** the inspector SHALL include: Summary (top metadata + status badges), Related Resources chips (as defined by the relationship spec), Status & Conditions (or equivalent health block), Referenced Manifests (spec excerpts/environment/config refs), Recent Events, and YAML. Sections MAY collapse if empty but SHALL remain in the same order to preserve muscle memory.

#### Scenario: Sensitive & Missing Data
- **GIVEN** a resource lacks certain sections (e.g., Secrets have no “Referenced Manifests” content or events are unavailable)
- **WHEN** the inspector renders
- **THEN** it SHALL show a muted placeholder explaining the absence instead of removing the section, and sensitive data (Secret values, token fields) SHALL be redacted per SSOT policy while still supporting copy chips for names/keys.

### Requirement: Resource Columns & Filters Contract
Each `/resources/<kind>` page SHALL declare its columns, default sort, and filter widgets via configuration so that the list + inspector factory can render them consistently.

#### Scenario: Declarative Config
- **GIVEN** a new resource kind is added to the Resources nav
- **WHEN** developers register it with the `ResourcePageConfig`
- **THEN** the config SHALL define: API endpoint + serializer, list columns (key, label, value formatter), default sort, filters (namespace, label selector, extra kind-specific ones), relation builders, and inspector section toggles. The factory SHALL consume this config without bespoke page code beyond the config.

#### Scenario: Consistent Filters & Pagination
- **GIVEN** a user adjusts filters/pagination on any `/resources/<kind>` page
- **WHEN** they switch to a sibling resource kind
- **THEN** the filter bar SHALL reset to that kind’s defaults but maintain shared primitives (namespace dropdown, search, label selector) so the experience feels identical; pagination default remains 10 rows per spec, and configs SHALL not bypass the shared paginator.
