# Change: Consolidate Sidebar Nav Configuration

## Why
- Two nav config files (`navConfigV1.ts` + `navConfigV2.ts`) coexist solely behind a feature flag that is no longer used, creating confusion when engineers patch navigation.
- The Sidebar component carries branching logic for the flag, even though V2 already replaced V1 everywhere else; keeping the toggle adds unnecessary complexity.
- Renaming the remaining config to a neutral `navConfig.ts` will avoid follow-up churn when future iterations need to reference “the nav config.”

## What Changes
- Remove `navConfigV2.ts` and delete the associated feature-flag branches in `Sidebar.tsx` so the component always reads from a single source of truth.
- Rename `navConfigV1.ts` to `navConfig.ts`, updating all imports.

## Impact
- **Specs**: None.
- **Code**: `src/components/layout/Sidebar.tsx`, nav config file, and any modules importing them.
- **Risk**: Low (straightforward cleanup).
