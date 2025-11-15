## ADDED Requirements
### Requirement: Related Resources Quick Links
Resource inspectors SHALL include a dedicated “Related Resources” section that surfaces key associations (owner, workloads, nodes, PVCs, ConfigMaps, Secrets, child Pods, namespaces, services) as actionable chips that jump directly to the corresponding `/resources/<kind>` view.

#### Scenario: Chip Rendering
- **GIVEN** a user opens an inspector (e.g., `/resources/pods`)
- **WHEN** related entities exist (e.g., a Pod has an owner Deployment and PVC volumes)
- **THEN** the inspector SHALL list each relationship as a chip showing the target kind + name, optionally with an icon/badge, and clicking the chip SHALL navigate to `/resources/<kind>?selection=<name>&namespace=<ns>` (when scoped). Chips MUST be consistent across resource types and appear even if the relation list is short.

#### Scenario: Navigation & Selection
- **GIVEN** the user clicks a relation chip
- **WHEN** the destination page loads
- **THEN** the specified resource SHALL be pre-selected in the list (scroll into view, inspector opens), automatically switching namespace filters (and pagination page) when needed so users can continue the trace without manually searching.
- **AND** if the target no longer exists, the chip SHALL degrade to a disabled/copy state and navigation SHALL surface a toast rather than leaving the user on an empty list.

#### Scenario: Empty/Fallback
- **GIVEN** no related entities are found
- **WHEN** the inspector renders
- **THEN** the Related Resources section SHALL show a muted “No related resources” state rather than disappearing, so the layout remains consistent.
- **AND** relations SHOULD be derived from data already fetched for the inspector whenever possible; if an additional call is required (e.g., listing pods on a node), the UI SHALL handle loading states inline without blocking other sections.
