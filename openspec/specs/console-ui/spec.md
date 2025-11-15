# console-ui Specification

## Purpose
TBD - created by archiving change refine-resource-inspector. Update Purpose after archive.
## Requirements
### Requirement: Resource Browser Shell
The `/resources/<kind>` surfaces MUST live inside the primary dashboard shell so the sidebar/header stay visible, but the page itself SHALL remain single-column (no extra in-page nav).

#### Scenario: Shared Dashboard Layout
- **GIVEN** a user opens `/resources/pods` (or any other kind)
- **WHEN** the page renders
- **THEN** it SHALL inherit the same sidebar + header layout used by Mission Control (no standalone page chrome), reiterate the “Raw Kubernetes Explorer” heading, and rely solely on the global sidebar for navigation cues (no mini nav on the page body).

### Requirement: Filtered List + Inspector Stack
Resources pages MUST present content in a stacked order: (1) an expanded filter/pagination toolbar, (2) a paginated list (default 10 rows) built with Resource-specific primitives, and (3) the inspector beneath the list (drawer on mobile).

#### Scenario: Filter & Pagination Controls
- **GIVEN** the user loads `/resources/<kind>`
- **WHEN** the filter bar renders
- **THEN** it SHALL provide multi-criteria inputs (e.g., search by name, namespace selector, status dropdown, label selectors, time range) plus pagination controls with a default of 10 rows per page and the ability to move to next/previous pages.
- **AND** the list SHALL reflect those filters/pagination params without reusing the Mission Control `components/k8s/shared/ResourceTable`.

#### Scenario: Inspector Placement
- **GIVEN** a row is selected
- **WHEN** the inspector content renders
- **THEN** it SHALL appear beneath the list on desktop and mobile (no side-by-side view), while the mobile drawer behavior (accordion sections for Summary/Spec/Status/Events/YAML) remains consistent with SSOT expectations.

### Requirement: Resources Navigation
Resources navigation MUST continue to follow the SSOT taxonomy within the global sidebar (Workloads, Networking, Config & Storage, Cluster) and every entry SHALL route to `/resources/<kind>` regardless of Mission Control counterparts.

#### Scenario: Consistent Routing
- **GIVEN** the sidebar renders either nav V1 or V2
- **WHEN** the user expands “Resources”
- **THEN** each nested link SHALL point to `/resources/<kind>` (with 🚧 placeholders allowed) so the navigation model stays resource-first and no link sends users back to Mission Control.

#### Scenario: Category Persistence
- **GIVEN** Resources adds or hides kinds under Workloads/Networking/etc.
- **WHEN** the navigation tree updates
- **THEN** the tree SHALL preserve category headers and child order defined in SSOT, keeping Raw Explorer context independent from Mission Control groupings.

### Requirement: Resources Coverage Matrix
Every Resources category SHALL provide a fully populated `/resources/<kind>` page with kind-specific columns, filters, and inspector behavior so SREs can rely on the Raw Explorer instead of placeholder shells.

#### Scenario: Workloads Coverage
- **GIVEN** `/resources/pods`, `/resources/deployments`, `/resources/statefulsets`, `/resources/daemonsets`, `/resources/jobs`, and `/resources/cronjobs`
- **WHEN** a workloads page renders
- **THEN** the table SHALL show namespace, readiness counts (ready/desired/current/updated), restart/activity indicators, and age with filters for namespace, status (healthy/progressing/degraded for controllers; running/succeeded/failed for Jobs; active/suspended for CronJobs), label selector, and created time so operators can slice by lifecycle state without leaving the page.

#### Scenario: Networking Coverage
- **GIVEN** `/resources/services` and `/resources/ingresses`
- **WHEN** the networking pages render
- **THEN** Service rows SHALL list type, ClusterIP/external IPs, ports, and age, filtering by namespace, service type, label selector, and created time, while Ingress rows SHALL include namespace, hosts, backend count, and age with filters for namespace, host presence, label selector, and created time.

#### Scenario: Config & Storage Coverage
- **GIVEN** `/resources/configmaps`, `/resources/secrets`, `/resources/pvcs`, and `/resources/pvs`
- **WHEN** these pages render
- **THEN** ConfigMaps/Secrets SHALL expose namespace, type, key count, and age (sharing namespace/time filters) while PVCs/PVs SHALL list storage class, requested/bound capacity, phase/status, and age with namespace or cluster filters plus status dropdowns reflecting binding states.

#### Scenario: Cluster Coverage
- **GIVEN** `/resources/nodes` and `/resources/namespaces`
- **WHEN** a cluster-scoped page renders
- **THEN** the namespace filter SHALL hide automatically, the list SHALL surface readiness/state along with age, and status dropdowns SHALL focus on Node readiness (Ready/NotReady) or Namespace phase (Active/Terminating). Navigation chips SHALL support query-parameter selection even for cluster resources.

### Requirement: Inspector Composition Parity
Resource inspectors SHALL share a consistent set of sections so the experience is predictable irrespective of the resource kind.

#### Scenario: Sensitive & Missing Data
- **GIVEN** a resource lacks certain sections (e.g., Secrets have no “Referenced Manifests” content or events are unavailable)
- **WHEN** the inspector renders
- **THEN** it SHALL show a muted placeholder explaining the absence instead of removing the section.
- **AND** sensitive data (e.g., values in a `Secret`, token fields in a `ServiceAccount`) **MUST** be redacted or omitted entirely from the UI. The inspector SHOULD display keys or metadata about the sensitive data (like key names in a Secret), but never the plaintext values themselves.
- **AND** backend transformers MUST keep sensitive payloads encoded (e.g., base64 values from Kubernetes Secrets) so any consumer that truly needs plaintext must explicitly opt into decoding and accept the associated audit responsibilities.

### Requirement: ResourcePageConfig & Factory Contract
/resources pages SHALL be defined declaratively via a `ResourcePageConfig` consumed by `ResourcePageFactory` so new kinds can be added without bespoke wiring.

#### Scenario: Declarative Pages
- **GIVEN** a new resource page is added
- **WHEN** developers supply a `ResourcePageConfig`
- **THEN** the config MUST declare `resourceBase`, `columns`, `namespace` scope, `statusOptions`, `detailParams`, `relation builders`, and the `inspector` component. `ResourcePageFactory` SHALL handle query-param selection (`?selection=&namespace=`), namespace/status/label/time filters, pagination (default 10 rows), and SWR data fetching automatically.

#### Scenario: Filter Consistency
- **GIVEN** a user navigates between `/resources/<kind>`
- **WHEN** the router switches kinds
- **THEN** each page SHALL reuse the shared filter bar (search, namespace dropdown when applicable, status dropdown when provided, label selector, created time range) so the only differences are the status options defined in the config. Cluster-scoped kinds SHALL hide the namespace filter automatically through the factory.

### Requirement: Sidebar Ordering & Accordion Behavior
The sidebar SHALL be driven by a single configuration file referenced directly by the layout components.

#### Scenario: Single Nav Config Source
- **GIVEN** navigation settings need to be updated
- **WHEN** engineers adjust sidebar sections/order
- **THEN** they SHALL edit a single `navConfig.ts` file consumed directly by the `Sidebar` component (no feature flags or duplicate configs) so behavior stays consistent in one place.

### Requirement: Sidebar Height & Scrolling
The sidebar frame SHALL maintain a height that displays the entire nav stack (with the longest second-level list expanded) without requiring its own scrollbar; the main content region handles overflow scrolling.

#### Scenario: Layout Constraints
- **GIVEN** the dashboard shell renders
- **WHEN** any second-level menu expands
- **THEN** the sidebar SHALL remain fully visible without internal scrolling, relying instead on compact spacing and the single-open accordion to keep links accessible. Only the page content beneath the header may scroll.

### Requirement: Route Tree Mirrors IA
Next.js app routes and API proxies SHALL mirror the sidebar information architecture to simplify discoverability.

#### Scenario: Mission Control Structure
- **GIVEN** Mission Control → App Runtime → Pods exists in the sidebar
- **WHEN** developers inspect `src/app/(dashboard)` (and matching `src/app/api`)
- **THEN** the pods list/detail pages and API endpoints SHALL live under `mission-control/app-runtime/pods/...`, matching the navigation hierarchy while preserving public URLs (via `route.ts` re-exports or redirects where needed).

#### Scenario: Resources & AI Copilot Structure
- **GIVEN** Resource and AI Copilot entries exist
- **WHEN** new routes are added
- **THEN** files SHALL be nested under `resources/<category>/<kind>` or `ai-copilot/<tool>` respectively so future contributors can map code to nav entries without hunting through flat directories.

