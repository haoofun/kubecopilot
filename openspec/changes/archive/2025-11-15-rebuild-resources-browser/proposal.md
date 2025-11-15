# Change: Realign Resources Browser Layout

## Why
- `/resources/*` lives outside `src/app/(dashboard)` which strips the global sidebar/header that SSOT says must always frame the console. Users lose navigation context and bounce between Mission Control and Resources manually.
- The current pages reuse the Mission Control `ResourceTable` paradigm (flat table-first layout) instead of the “Raw Kubernetes Explorer” split-view defined in SSOT (§6.2.2). The inspector/table pair feels bolted on and there is no per-category navigation tree.
- Nav config entries under “Resources” point to a mix of `/resources/*` and `/pods` routes, causing inconsistent routing and duplicated IA. The end result does not meet the three-level tree requirement nor align with the positioning difference between Mission Control (problem-first) vs Resources (resource-first).

## What Changes
- Rehost all `/resources/*` routes inside `src/app/(dashboard)/resources` so they inherit the sidebar/header shell and so Next.js only renders one layout tree for both Mission Control and Resources.
- Keep navigation unified via the global sidebar—no in-page mini nav—while still surfacing the “Raw Kubernetes Explorer” header context.
- Replace the split view with a single column flow: an expanded `ResourceFilterBar` capable of multi-criteria filtering (name, namespace, status, label selectors, etc.) plus pagination controls (default 10 rows/page), followed by a Resource list and the inspector stacked beneath it.
- Build/extend the Resources list primitive so it supports pagination, sticky filter actions, and selection states without reusing the Mission Control `ResourceTable`.
- Rewire Pods/Deployments/Nodes to the new stacked layout (filters → paginated list → inspector) and ensure placeholder routes remain for other kinds.
- Update sidebar nav configs so every Resources entry links to `/resources/<kind>` while relying solely on the global sidebar for navigation cues.
- Document the new layout/filter/pagination behavior inside the console UI spec so future work understands the Resource-vs-Mission-Control distinction.

## Impact
- **Specs**: `console-ui` gains explicit requirements for the Resources shell, navigation tree, and split-view composition rules.
- **Code**: `src/app/(dashboard)/resources/**`, `src/components/resources/**`, and `src/config/navConfig*.ts`.
- **Risk**: Medium. Moving routes touches Next.js layouts and nav configs; must ensure legacy `/pods` style views keep functioning. Added layout primitives must not regress Mission Control bundles or hydration.
