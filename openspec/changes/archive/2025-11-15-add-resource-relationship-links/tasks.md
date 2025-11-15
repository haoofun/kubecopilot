## 1. Spec Alignment
- [x] 1.1 Update the `console-ui` spec: remove/replace the obsolete split-view requirement, describe the Related Resources section (chips, empty states), and capture the navigation contract (`?selection=` + optional `namespace=` auto-switch behavior, missing-target UX).

## 2. Shared Patterns
- [x] 2.1 Create a reusable `ResourceRelations` component that renders chips with icons/labels, supports disabled/copy-only states, and displays a muted “No related resources” fallback.
- [x] 2.2 Add a helper (`buildResourceRelations`) so inspectors can derive relation data from existing summary data; document when a targeted fetch (e.g., listing node pods) is acceptable and ensure helpers flag missing targets.

## 3. Inspector Enhancements (Wave 1)
- [x] 3.1 Update `PodInspector` to show owning workload, node, PVCs, ConfigMaps/Secrets referenced via volumes, and expose quick navigation chips (with copy fallback if relation is stale). 
- [x] 3.2 Update `DeploymentInspector` to expose related pods (`/resources/pods?selection=`), ConfigMaps/Secrets referenced by the template, and Services routed to the deployment.
- [x] 3.3 Update `NodeInspector` to list assigned pods and namespaces/labels that permit navigation; include copy chips if we cannot build the link.

## 4. Navigation Behavior
- [x] 4.1 Implement query-param based row preselection for `/resources/<kind>` pages: parse `selection` + optional `namespace`, auto-switch namespace filters, ensure pagination/scroll bring the row into view, and clear selection when navigating away.
- [x] 4.2 Handle missing targets gracefully: disable the chip or show a tooltip + copy affordance instead of navigating to a 404, and emit a toast if navigation fails mid-flight.

## 5. Validation
- [x] 5.1 Smoke-test `/resources/{pods,deployments,nodes}` on desktop + mobile verifying chips render, navigation preselects the right row (including namespace switch), and missing-target fallbacks behave.
- [x] 5.2 Run `npm run lint` and update documentation/screenshot references if needed.
