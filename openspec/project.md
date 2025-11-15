# Project Context: KubeCopilot

## Purpose
KubeCopilot is an AI-enhanced Kubernetes cockpit designed for SRE and DevOps engineers. Its vision is to become an AI-Native Infrastructure Layer that enables teams to govern complex Kubernetes systems in an engineering-centric way. Unlike traditional visualization tools, KubeCopilot understands, explains, and generates structured remediation plans, shifting operations from "dashboard analysis" to "dialogue-driven decision execution."

## Tech Stack
- **Core Framework**: Next.js 14 (App Router), TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Magic UI
- **State Management**: Zustand
- **Backend**:
  - **K8s Client**: `@kubernetes/client-node`
  - **ORM**: Prisma with PostgreSQL (production) and SQLite (local)
- **AI & Validation**:
  - **LLM Clients**: `openai` or `@google/generative-ai` (via an abstraction layer)
  - **Schema Validation**: Zod
- **Code Quality**: ESLint, Prettier, Husky

## Project Conventions

### Code Style
- **Formatting**: Enforced by Prettier (2-space indent, single quotes, no semicolons).
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for route folders.
- **Linting**: ESLint rules are enforced via Husky pre-commit hooks.

### Architecture Patterns
- **Monorepo Structure**: The project uses npm workspaces to manage `packages/` (domain logic, UI kit) and `services/` (future microservices).
- **App Router**: The frontend is built on the Next.js App Router, with pages in `src/app/(dashboard)` and API routes in `src/app/api`.
- **Secure Backend Proxy**: All interactions with the Kubernetes API are handled by a secure backend proxy. The frontend never communicates directly with the K8s API server.
- **AI Orchestrator**: A central backend component responsible for managing the prompt lifecycle, calling LLMs, and coordinating with the Risk Engine and Audit Store.
- **Configuration-Driven UI**: Key UI components like the sidebar navigation are driven by configuration objects to allow for safe, iterative changes.

### Testing Strategy
A phased "testing pyramid" approach is adopted:
- **Phase 1**: No tests; focus on static analysis with ESLint and Prettier.
- **Phase 2**: Introduce Unit/Integration tests (Jest/Vitest) for critical backend logic (AI Orchestrator, Risk Engine).
- **Phase 3+**: Introduce Frontend tests (React Testing Library) for complex UI components.
- **Future**: Introduce E2E tests (Playwright/Cypress) in the CI/CD pipeline.

### Git Workflow
- **Branching Model**: **GitHub Flow**. `main` is always deployable. All work is done on feature branches (`feat/...`, `fix/...`) and merged via Pull Requests.
- **Commit Messages**: **Conventional Commits** format (`<type>(<scope>): <subject>`) is strictly enforced to ensure a readable Git history and enable automated changelog generation.

## Domain Context
- **OperationPlan**: This is the most critical abstraction in the project. Every write operation MUST be encapsulated in an `OperationPlan` object. It's a structured, auditable, and verifiable contract that connects the AI's intent with the Kubernetes API. It contains the diff, risk assessment, and audit trail.
- **Prompt Registry**: All prompts are treated as versioned infrastructure, managed in a central manifest (`prompts/manifest.json`). This allows prompts to be versioned, validated, and progressively rolled out, ensuring governance over the AI's behavior.

## Important Constraints
- **Secure by Default**: All write operations must be reviewed via an `OperationPlan`. Sensitive credentials like `kubeconfig` are handled with maximum security standards and never exposed to the frontend.
- **Structured & Auditable**: All AI outputs, especially suggestions for write operations, must be structured and validated against a schema (Zod). All changes must leave a clear, immutable audit log.
- **Development Environment Parity**: All development must occur within **WSL2 (Ubuntu)** to ensure consistency with the Linux-based production environment and avoid "works on my machine" issues.

## External Dependencies
- **Kubernetes API Server**: The primary endpoint for all cluster interactions.
- **LLM Provider**: External Large Language Model APIs, such as OpenAI (GPT series) or Google (Gemini series).
- **Monitoring Source**: Prometheus is planned for integration to provide metrics for diagnostics and SLO tracking.