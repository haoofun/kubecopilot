# Repository Guidelines

## Project Structure & Module Organization
- App Router lives in `src/app`; screens sit under `(dashboard)` and REST proxies under `api/k8s/*`.
- Shared UI stays in `src/components`, hooks in `src/hooks`, and Kubernetes helpers in `src/lib/k8s`.
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
