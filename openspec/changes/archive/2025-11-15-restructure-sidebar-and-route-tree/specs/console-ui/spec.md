## ADDED Requirements
### Requirement: Sidebar Ordering & Accordion Behavior
The primary sidebar SHALL present top-level groups in the order: SRE Mission Control, Dashboards, Resources, AI Copilot, Audit; only one second-level group may be expanded at a time.

#### Scenario: Fixed Ordering
- **GIVEN** the sidebar renders on desktop or mobile
- **WHEN** top-level sections appear
- **THEN** they SHALL follow the order above, with AI Copilot always placed immediately before Audit so critical operations entries remain near the top and compliance items stay anchored at the bottom.

#### Scenario: Single-Open Accordion
- **GIVEN** a user interacts with second-level menus (e.g., SRE Mission Control → Health)
- **WHEN** they click a section header
- **THEN** that section SHALL expand while all other sections collapse; clicking the same header again SHALL collapse it, and opening a different header SHALL automatically close the previously opened one.

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
