## ADDED Requirements
### Requirement: Resource Inspector Layout Refinement
The `/resources/<kind>` experience SHALL adopt the refined layout that balances table and inspector usage while keeping the navigation shell intact.

#### Scenario: Desktop Layout
- **GIVEN** the user opens `/resources/pods`, `/resources/deployments`, or `/resources/nodes` on a desktop viewport
- **WHEN** the page renders
- **THEN** filters SHALL collapse into a toolbar above the table, the table SHALL have a bounded height with internal scroll, and the inspector SHALL sit in a second column that can be collapsed or resized.
- **AND** inspector content SHALL use a responsive grid (e.g., Summary/Scheduling side-by-side) with sticky tabs so users can jump between Overview, Events, and YAML without excessive scrolling.
- **AND** the navigation sidebar SHALL remain visible at typical desktop widths (no accidental full-width takeover by the resource view).

#### Scenario: Mobile Layout
- **GIVEN** the user is on a mobile viewport
- **WHEN** they open the inspector drawer
- **THEN** the inspector content SHALL use accordion sections (Summary, Spec, Status, Events, YAML) so users can expand/collapse sections rather than scrolling a single long column.

#### Scenario: Inspector Controls
- **GIVEN** the user needs more space for the table
- **WHEN** they click the collapse toggle or drag the splitter
- **THEN** the inspector SHALL hide/shrink accordingly without losing state, and a button SHALL allow reopening it.

#### Scenario: Data Integrity
- **GIVEN** tabs/anchors are reorganized
- **WHEN** the user navigates to Events/YAML
- **THEN** the existing behaviors (Events fetched via server-side fieldSelector, YAML copy button) SHALL continue functioning.
