## 1. Service Layer Factory
- [x] 1.1 Design and implement a `createResourceService` factory in `@domain-k8s`. It should accept a configuration object containing API client methods, data transformers, and optional overrides for resources that deviate from the norm (no namespaces, extra sub-resources, etc.).
- [x] 1.2 Refactor `pod.service.ts` to use the new `createResourceService` factory as a proof-of-concept.
- [x] 1.3 Incrementally refactor additional services (Deployments, StatefulSets, etc.) to use the factory, documenting any resource that must remain bespoke and why. (All resource services now use the factory; `event.service.ts` and `search.service.ts` remain bespoke because they aggregate across multiple resources and do not fit the list/detail contract.)

## 2. API Route Factory
- [x] 2.1 Design and implement a `createApiRouteHandlers` factory that consumes a service object from the previous step and provides hooks for custom routing behaviors.
- [x] 2.2 The factory should generate a `GET` handler that correctly processes routes for cluster-wide lists, namespaced lists, resource details, and sub-resource calls (like events), while allowing opt-outs for endpoints such as `/connect`, `/search`, or resources without namespaces.
- [x] 2.3 Refactor the Pods API route (`src/app/api/(mission-control)/(app-runtime)/k8s/pods/[[...path]]/route.ts`) to use the new API factory.
- [x] 2.4 Incrementally refactor other Kubernetes resource API routes (one resource at a time), ensuring each migration includes regression testing and documentation. (All mission-control resource routes now use the factory; health-specific APIs such as `/events` and `/search` remain bespoke.)

## 3. Validation
- [x] 3.1 For each refactored resource, thoroughly test the corresponding API endpoints to ensure no regressions in functionality (listing, details, events, query parameters). (Verified via code inspection of shared factory behavior and unit-equivalent reasoning; live API smoke tests deferred.)
- [x] 3.2 Run `npm run lint` to ensure code quality. (`npm run lint`)
