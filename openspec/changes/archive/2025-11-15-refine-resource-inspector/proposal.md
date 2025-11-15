# Change: Refine Resource Inspector Layout

## Why
The first Resource Inspector implementation focused on functionality (kubectl-like data completeness) but the desktop layout now feels unbalanced: the filter + table stack dominates the upper-left, the inspector is a single tall column on the right, and there's a large empty band between them. Users need a denser, more ergonomic layout that matches the “Raw Kubernetes Explorer” promise without forcing excessive scrolling or hiding the navigation experience.

## What Changes
- Rework the `/resources/<kind>` desktop layout to use a two-column grid where filters collapse into a toolbar, tables have constrained height with internal scroll, and the inspector can be resized or collapsed.
- Redesign the inspector content as cards arranged in a responsive grid/accordion so key sections (Summary, Scheduling, Status) appear side-by-side rather than one long column. Add sticky tabs/anchors so users can jump between Overview/Events/YAML.
- Ensure mobile behavior remains drawer-based but uses accordion sections inside the inspector to reduce vertical scroll.
- Introduce an optional inspector toggle (e.g., collapse/expand button or adjustable splitter) so users needing a wider table can temporarily hide the inspector.

## Impact
- **Affected Specs**: `console-ui` (adjust Resource Inspector requirements to include layout refinements).
- **Affected Code**: `/resources/*` pages, shared ResourceFilterBar/Table/Inspector components, Pod/Deployment/Node inspector layouts, supporting styles.
- **Risk**: Moderate UX refactor; must ensure responsiveness and accessibility remain intact.
