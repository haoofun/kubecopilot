## 1. Spec Alignment
- [x] 1.1. Update the console UI spec to capture the stacked Resources layout (global sidebar only, expanded filter controls, pagination, inspector below the list).

## 2. Shared Components
- [x] 2.1. Enhance `ResourceFilterBar` to support multiple filter inputs (search, namespace, status, label selector/multi-select) plus pagination controls (page size, next/prev) surfaced inline.
- [x] 2.2. Extend/replace the Resource list primitive so it handles pagination (default 10 rows), communicates empty/loading/error states, and exposes selection state for the inspector without relying on Mission Control tables.

## 3. Page Refactors
- [x] 3.1. Rework `/resources/pods` to use the new stacked layout (filters → paginated list → inspector) and wire up the richer filters/pagination to the underlying data hooks.
- [x] 3.2. Apply the same pattern to `/resources/deployments` and `/resources/nodes`, ensuring each continues to fetch detail data for the inspector.
- [x] 3.3. Keep placeholder routes for remaining resource kinds pointing at `/resources/<kind>` so navigation never 404s.

## 4. Validation
- [x] 4.1. Smoke-test `/resources/{pods,deployments,nodes}` on desktop + mobile to confirm pagination defaults to 10 items, filter chips behave, and the inspector sits below the list.
- [x] 4.2. Run `openspec validate rebuild-resources-browser --strict` plus `npm run lint` and call out any gaps in the PR.
