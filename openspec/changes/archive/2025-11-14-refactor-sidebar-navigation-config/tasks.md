## 1. Document Current State (V1)
- [x] 1.1. Read `src/components/layout/Sidebar.tsx` to fully understand the current navigation structure.
- [x] 1.2. Update `SSOT.md` by adding a new section "Navigation Architecture V1" that documents this structure.
- [x] 1.3. Extend the same section with "Navigation Architecture V2", detailing the new IA, why it differs from V1, the placeholder-route strategy, and how to toggle the feature flag per environment.

## 2. Refactor to Configuration-Driven (V1)
- [x] 2.1. Create a new file `src/config/navConfigV1.ts` that exports the current navigation structure as a JavaScript object.
- [x] 2.2. Refactor `src/components/layout/Sidebar.tsx` to import and render the sidebar from the `navConfigV1` object.
- [x] 2.3. **Verify** that the application's appearance and sidebar functionality are identical to the state before the refactoring.

## 3. Implement New Structure (V2) with Feature Flag
- [x] 3.1. Create a new file `src/config/navConfigV2.ts` that exports the five first-level groups provided by product (AI Copilot, SRE Mission Control, Dashboards, Resources, Audit) with their specified child links, ensuring every `href` points to an existing page—even if that page is a placeholder. Resources groups MUST include all concrete Kubernetes resources as grandchildren and Overview SHALL appear in both Mission Control and Dashboards.
- [x] 3.2. Modify `src/components/layout/Sidebar.tsx` to implement a feature flag. It should import both `navConfigV1` and `navConfigV2` from `src/config/` and select which one to render based on `NEXT_PUBLIC_ENABLE_NAV_V2`.
- [x] 3.3. Document that the feature flag is disabled by default and only enabled locally. Update `.env.local` to include `NEXT_PUBLIC_ENABLE_NAV_V2=true` for development, and update `.env.example` with `NEXT_PUBLIC_ENABLE_NAV_V2=false` as the baseline.
- [x] 3.4. **Verify** that the new V2 navigation structure renders correctly in the local development environment when the flag is enabled.
- [x] 3.5. Create placeholder routes under `src/app/` for all net-new links so nav items never 404:
      - `ask-cluster/page.tsx`
      - `ai-diagnosis/page.tsx`
      - `dashboards/cluster/page.tsx`
      - `dashboards/workloads/page.tsx`
      - `dashboards/network/page.tsx`
      - `dashboards/storage/page.tsx`
      - `audit/operations/page.tsx`
      - `audit/events/page.tsx`
      - `audit/api-logs/page.tsx`
    Each file SHALL export a default component returning `<div>🚧 Coming Soon</div>`.

## 4. Final Validation
- [x] 4.1. Manually test the sidebar in both V1 (flag off) and V2 (flag on) modes, including toggling collapsible groups and confirming active link highlighting per `console-ui` spec scenarios.
- [x] 4.2. Run `npm run lint` to ensure all new and modified files adhere to the project's code quality standards.
