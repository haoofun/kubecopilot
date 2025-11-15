## 1. Align Layout Principles
- [x] 1.1. Update `SSOT.md` to describe the refined Resources layout (toolbar filters, bounded table, inspector grid/accordion, collapse behavior).
- [x] 1.2. Expand the console UI spec with layout-specific requirements (two-column grid, inspector collapse, sticky tabs, accordion on mobile).

## 2. Rework Shared Components
- [x] 2.1. Enhance `ResourceFilterBar` to support a compact toolbar mode and responsive wrapping.
- [x] 2.2. Update `ResourceTable` wrapper to enforce max height with internal scroll, and provide optional footer/summary content to avoid empty space.
- [x] 2.3. Rebuild `ResourceInspector` shell to include a collapse/expand control, resizable columns (desktop), and sticky tabs; ensure mobile drawer uses accordion sections.

## 3. Apply Layout to Pods/Deployments/Nodes
- [x] 3.1. Reflow pod inspector sections into a responsive grid (e.g., Summary + Scheduling side-by-side) and add anchor links/tabs for quick jumps.
- [x] 3.2. Rework deployment inspector cards similarly, ensuring template/spec/status/pods fit within the new grid.
- [x] 3.3. Rework node inspector cards to use the same pattern, adding taints/runtime cards alongside metadata.
- [x] 3.4. Adjust pages to use the new collapsible inspector and ensure the table column width looks balanced on desktop.

## 4. Validation
- [ ] 4.1. Smoke-test `/resources/pods`, `/resources/deployments`, and `/resources/nodes` on desktop + mobile; confirm inspector collapse/resizable behavior and that navigation remains visible.
- [ ] 4.2. Verify tabs/anchors work correctly and the Events tab still uses server-side `fieldSelector` queries.
- [x] 4.3. Run `npm run lint` and capture before/after screenshots/gifs for review.
