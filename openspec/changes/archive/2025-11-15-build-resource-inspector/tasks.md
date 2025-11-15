## 1. Define Resource Inspector Foundations
- [x] 1.1. Document the Resources philosophy and layout expectations in `SSOT.md` (Raw Kubernetes Explorer, two-pane layout, Tier 1/2 fields vs Tier 3 in YAML).
- [x] 1.2. Update the sidebar navigation copy (if needed) to note “Raw Kubernetes Explorer” for the Resources group.
- [x] 1.3. Design view-model helpers in `packages/domain-k8s` that expose Tier 1/2 fields while still returning the raw object for YAML/Events.
    - [x] 1.3.1. Modify `/api/k8s/<kind>` interfaces to add a `raw=true` query parameter, enabling them to return complete, unmodified Kubernetes resource objects.

## 2. Build Pods Resource View (Phase 1 MVP)
- [x] 2.1. Create `src/app/resources/pods/page.tsx`. Use the existing `useK8sResourceList` hook to fetch pod data and `useK8sResourceDetail` for the selected pod.
- [x] 2.2. Implement generic, reusable components for the resource view:
    - [x] `ResourceTable`: Handles row selection, loading/empty states, and column definitions. It should select the first row by default after data loads.
    - [x] `ResourceFilterBar`: Manages namespace, status, and name filters. It must use the existing `/api/k8s/namespaces` endpoint to populate the namespace list. It should also dynamically load status filters based on the resource kind.
    - [x] `ResourceInspector`: The main shell for desktop split + mobile drawer layout. It must handle and display a clear message for empty or unselected states.
- [x] 2.3. Implement generic inspector tabs that can be reused across different resource kinds:
    - [x] `MetadataTab`: Displays labels and annotations from `resource.metadata`.
    - [x] `EventsTab`: Fetches and displays events for the resource. It should initially load a fixed number of recent events (e.g., 20) and provide a "Load More" option.
    - [x] `YAMLTab`: Displays the full raw resource object and must include a "Copy" button.
- [x] 2.4. Implement Pod-specific inspector tabs:
    - [x] `PodSpecTab`: Renders Pod spec details (containers, initContainers, scheduling).
    - [x] `PodStatusTab`: Renders Pod status details (phase, conditions, container states).

## 3. Extend to Deployments and Nodes
- [x] 3.1. Reuse generic components (`ResourceTable`, `ResourceInspector`, etc.) to build the `/resources/deployments` page.
- [x] 3.2. Implement Deployment-specific inspector tabs (`DeploymentSpecTab`, `DeploymentStatusTab`).
- [x] 3.3. Reuse generic components to build the `/resources/nodes` page.
- [x] 3.4. Implement Node-specific inspector tabs (`NodeSpecTab`, `NodeStatusTab`).
    - [x] 3.4.1. Ensure that on the Nodes page (and other cluster-scoped resource pages), the `ResourceFilterBar` automatically hides the namespace filter.

## 4. Final Polish & Validation
- [x] 4.1. Update navigation so Resources links route to `/resources/<kind>` while Mission Control retains existing routes.
- [ ] 4.2. Manually verify desktop split + mobile drawer behavior across Pods, Deployments, and Nodes.
- [ ] 4.2.1. In the browser's network tab, verify the Events tab's API call includes the correct `fieldSelector` query parameter and is not fetching all cluster events.
- [x] 4.3. Run `npm run lint` and ensure CI passes; capture screenshots/gifs for the proposal review.
