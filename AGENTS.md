<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Repository Guidelines

## Project Structure & Module Organization
- The application's UI is organized into five main sections reflecting different user workflows:
  - **AI Copilot**: Centralizes AI-powered tools like `Ask the Cluster` (`/ask-cluster`), `YAML Copilot` (`/yaml-copilot`), and `Operation Plans` (`/operation-plans`).
  - **Mission Control**: Provides an SRE-focused dashboard for troubleshooting. It includes views for `Health` (`/ai-diagnosis`), `App Runtime` (e.g., `/pods`, `/deployments`), and `Platform` resources.
  - **Dashboards**: Offers high-level visual dashboards for cluster, workload, network, and storage status under `/dashboards/*`.
  - **Resources**: Acts as a traditional Kubernetes resource browser, providing detailed views for all resource types (e.g., `/pods`, `/deployments`, `/services`).
  - **Audit**: Contains logs for operations, API calls, and events under `/audit/*`.
- App Router lives in `src/app`; screens sit under `(dashboard)` and REST proxies under `api/k8s/*`.
- Shared UI now lives in `packages/ui-kit`, hooks stay in `src/hooks`, and Kubernetes helpers reside in `packages/domain-k8s` behind the `@domain-k8s/*` alias.
- Database models live in `prisma/schema.prisma`; the generated client in `src/generated/prisma` must remain untouched.
- Assets sit in `public/`, global styles in `src/app/globals.css`, and architectural decisions in `SSOT.md`.

## Build, Test, and Development Commands
- Use `npm install` so `package-lock.json` stays the authority.
- `npm run dev` serves http://localhost:3000 for iterative work.
- `npm run build` emits the production bundle; `npm start` smoke-tests it.
- `npm run lint` runs ESLint + Prettier; resolve findings before commits.
- After Prisma schema edits run `npx prisma migrate dev` and `npx prisma generate`.

## Coding Style & Naming Conventions
- Lean on TypeScript: `.tsx` for components and routes, `.ts` for utilities. Next handlers stay in `route.ts`.
- Prettier enforces two-space indent, single quotes, and no semicolons; avoid manual overrides.
- Use PascalCase components, camelCase functions/variables, and kebab-case route folders.
- Prefer the `cn` helper in `src/lib/utils.ts` for conditional Tailwind class merging.

## Testing Guidelines
- No test runner is wired yet; when adding coverage, document the command (e.g. `npm run test`) in your PR.
- Co-locate specs with `.test.ts[x]` or grow a focused `tests/` directory as scope expands.
- Validate Prisma migrations locally and share seed or fixture steps whenever schema changes ship.

## Commit & Pull Request Guidelines
- Keep commits focused and lint-clean; run `npm run lint` plus any new tests before pushing.
- Follow Conventional Commits, mirroring the existing `feat(scope):` and `main:` patterns.
- PRs need a summary, linked issues, verification steps, and UI artifacts for visual shifts.
- Surface env vars, Kubernetes access, Prisma migrations, and SSOT updates so reviewers can reproduce quickly.

## SSOT Alignment
- Treat `SSOT.md` as the single source of truth for mission, phases, and SRE principles.
- When features touch AI prompts or risk posture, capture rationale in the SSOT alongside code.
- Keep testing maturity, rollout phases, and persona coverage aligned with the SSOT narrative.
- If work alters roadmap or capability scope, describe the delta in the SSOT change log.

## Security & Configuration Tips
- Never commit kubeconfig files or credentials; rely on `src/lib/session.ts` helpers and `.env.local`.
- Document any elevated cluster permissions or third-party integrations so reviewers can vet them safely.
