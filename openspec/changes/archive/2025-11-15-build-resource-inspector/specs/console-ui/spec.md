## ADDED Requirements
### Requirement: Resource Inspector Views
The Resources navigation group SHALL provide dedicated `/resources/<kind>` experiences that behave like a kubectl describe interface without affecting Mission Control routes.

#### Scenario: Layout and Routing
- **GIVEN** a user navigates to `/resources/pods`, `/resources/deployments`, or `/resources/nodes`
- **WHEN** the page renders on desktop
- **THEN** it SHALL show a two-pane layout with a table on the left and an inspector panel on the right (mobile collapses the inspector into a drawer).
- **AND** the inspector SHALL include Summary, Metadata, Spec, Status, Events, and YAML sections.
- **AND** the Events section SHALL query the Kubernetes Events API using `fieldSelector` filters for the selected resource (kind/name/namespace/uid), not by fetching all events client-side.

#### Scenario: Data Completeness
- **GIVEN** a resource inspector renders a Pod/Deployment/Node
- **WHEN** it displays Spec/Status information
- **THEN** Tier 1/Tier 2 fields (e.g., Pod containers, scheduling data, Deployment replica status, Node capacity/allocatable/taints) SHALL be surfaced in structured UI.
- **AND** Tier 3/rare fields SHALL remain accessible via the YAML section.
- **AND** the domain layer SHALL expose raw Kubernetes objects plus view-model helpers so UI components do not lose access to the manifest.

#### Scenario: Tables and Filters
- **GIVEN** the user is on a `/resources/<kind>` table
- **WHEN** they interact with filters
- **THEN** they SHALL have namespace and status filters plus name search in v1.
- **AND** cluster-scoped resources (e.g., Nodes) MAY hide the namespace filter while retaining status + search.
- **AND** label/field selector filters SHALL be documented as future work and not appear in the initial release.

#### Scenario: Phase 1 Scope
- **GIVEN** the Resources group promises a Raw Kubernetes Explorer
- **WHEN** the first iteration ships
- **THEN** Pods, Deployments, and Nodes SHALL have working `/resources/<kind>` pages using this inspector pattern.
- **AND** subsequent kinds (Services, ConfigMaps, PVCs/PVs, etc.) SHALL follow in later phases without blocking this change.
