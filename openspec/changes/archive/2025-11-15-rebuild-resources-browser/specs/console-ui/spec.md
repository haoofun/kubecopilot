## ADDED Requirements
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
