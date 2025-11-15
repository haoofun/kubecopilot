## MODIFIED Requirements
### Requirement: Sidebar Ordering & Accordion Behavior
The sidebar SHALL be driven by a single configuration file referenced directly by the layout components.

#### Scenario: Single Nav Config Source
- **GIVEN** navigation settings need to be updated
- **WHEN** engineers adjust sidebar sections/order
- **THEN** they SHALL edit a single `navConfig.ts` file consumed directly by the `Sidebar` component (no feature flags or duplicate configs) so behavior stays consistent in one place.
