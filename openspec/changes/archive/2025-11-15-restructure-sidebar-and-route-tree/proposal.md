# Change: Restructure Sidebar Behavior & Route Tree

## Why
- The current sidebar order puts AI Copilot first, which buries high-usage Mission Control content once users grow muscle memory. PM feedback requests moving Copilot further down so troubleshooting hubs remain top-of-mind, with Audit anchored at the bottom for compliance-only visits.
- Accordion behavior lets multiple second-level groups remain open simultaneously, causing the nav to stretch past the viewport; when Resources expands alongside Mission Control, users must scroll the sidebar to reach Audit links.
- The layout's height is fixed, so even without multiple sections open, some long groups require scrolling, making the nav feel jittery while the main content stays static.
- App routes under `src/app/(dashboard)` and matching API handlers live in flat folders (`/pods`, `/deployments`, etc.) that no longer map to the sidebar taxonomy. This causes confusion when engineers try to find the corresponding route for a nav entry (Mission Control vs Resources vs AI Copilot share file siblings).

## What Changes
- Reorder the top-level sidebar groups so SRE Mission Control remains first, Dashboards second, Resources third, AI Copilot fourth, and Audit last (always bottom). Update both nav configs so AI Copilot sits before Audit consistently.
- Introduce a single-open accordion pattern for level-two sections: clicking a section toggles it, and opening another auto-collapses the previous one. Clicking an already-open section collapses it. Apply this to all top-level groups with children.
- Reduce the sidebar's padding/vertical spacing and ensure the nav area scrolls independently only when content truly exceeds the adjusted viewport; the layout should keep the header+sidebar fixed while only the main content scrolls.
- Reorganize `src/app/(dashboard)` and `src/app/api` folders to mirror the sidebar taxonomy. For example, pods Mission Control routes move to `src/app/(dashboard)/mission-control/app-runtime/pods` (list + dynamic detail), and Resources variants nest under `.../resources/workloads/pods`, etc. Align API handlers likewise (e.g., `src/app/api/mission-control/app-runtime/pods`). Provide migration guidance and update import paths.

## Impact
- **Specs**: `console-ui` gains requirements for sidebar ordering, accordion behavior, constrained nav height, and route-folder alignment with IA.
- **Code**: Nav config files, sidebar component/accordion logic, layout CSS, route folder reorganizations (pages + APIs), and updated imports.
- **Risk**: Medium-high due to extensive file moves and layout adjustments; navigation regression tests and route redirects needed.
