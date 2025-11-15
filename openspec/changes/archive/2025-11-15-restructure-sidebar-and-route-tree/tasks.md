## 1. Spec Alignment
- [ ] 1.1 Update the `console-ui` spec with requirements covering sidebar order, accordion behavior (single section open), vertical sizing/scrolling constraints, and route-folder alignment with the IA taxonomy.

## 2. Sidebar Hierarchy & Behavior
- [ ] 2.1 Reorder `navConfigV1`/`navConfigV2` so AI Copilot sits before Audit and ensure both configs share the same top-level ordering.
- [ ] 2.2 Update the Sidebar component to support a single-open accordion for second-level menus (toggle closes on re-click, opening another closes current).
- [ ] 2.3 Adjust sidebar spacing/height to keep all nav entries visible without scrolling after accordion changes (content area remains scrollable, not the sidebar).

## 3. Route & API Restructure
- [ ] 3.1 Reorganize `src/app/(dashboard)` routes to match sidebar hierarchy (Mission Control, Resources, Dashboards, AI Copilot, Audit), moving list/detail pages accordingly and preserving existing URLs via Next.js route exports or redirects.
- [ ] 3.2 Mirror the taxonomy under `src/app/api`, grouping resource proxy handlers by the same tree, and update import paths/tests.

## 4. Regression & Docs
- [ ] 4.1 Verify navigation interactions (accordion toggles, order, scroll behavior) across desktop/mobile widths.
- [ ] 4.2 Run `npm run lint` (and other affected checks) plus update any developer docs referencing old paths.
