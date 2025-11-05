# GEMINI Project Context: KubeCopilot

## Project Overview

KubeCopilot is a web-based dashboard for managing and monitoring Kubernetes clusters. It provides a user-friendly interface to view and interact with Kubernetes resources like Deployments, Pods, Services, and Namespaces. The application is built as a modern, full-stack TypeScript project using the Next.js App Router.

**Key Technologies:**

*   **Framework**: [Next.js](https://nextjs.org/) (v15) with the App Router
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Frontend**:
    *   [React](https://react.dev/) (v19)
    *   **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
    *   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
    *   **Data Fetching**: [SWR](https://swr.vercel.app/) for client-side data fetching and caching.
*   **Backend**:
    *   **API**: Next.js API Routes
    *   **Kubernetes Client**: [`@kubernetes/client-node`](https://github.com/kubernetes-client/javascript) to interact with the Kubernetes API.
    *   **Session Management**: A server-side, in-memory session store secured with `httpOnly` cookies.
*   **Tooling**:
    *   **Linting & Formatting**: ESLint and Prettier, enforced by Husky pre-commit hooks.
    *   **Package Manager**: npm

**Architecture:**

The application follows a standard Next.js App Router architecture.

*   `src/app`: Contains the application's pages and API routes.
    *   `src/app/(dashboard)`: The main dashboard UI for authenticated users.
    *   `src/app/connect`: A page for users to authenticate by providing their `kubeconfig`.
    *   `src/app/api/k8s`: The backend API endpoints that the frontend calls to get Kubernetes data.
*   `src/lib/k8s`: A well-defined service layer that encapsulates all interaction with the Kubernetes cluster. It includes services for different resources, transformers to shape the data for the UI, and client management.
*   `src/hooks`: Contains custom React hooks, notably `useK8sResource.ts`, which is a generic SWR-based hook for fetching Kubernetes resource lists and details.
*   `src/components`: Contains the React components, organized by feature (`k8s`, `layout`) and reusability (`shared`, `ui`).
*   `src/middleware.ts`: Handles routing and authentication, redirecting users based on their session status.

## Building and Running

The project uses `npm` as its package manager.

*   **To run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

*   **To build the application for production:**
    ```bash
    npm run build
    ```

*   **To start the production server:**
    ```bash
    npm run start
    ```

*   **To run the linter:**
    ```bash
    npm run lint
    ```

## Development Conventions

*   **Code Style**: The project uses ESLint and Prettier for code linting and formatting. These are automatically run on pre-commit via Husky and lint-staged.
*   **Path Aliases**: The project is configured with a path alias `@/*` which maps to the `src/` directory.
*   **Components**: The UI is built with shadcn/ui components, and custom components are organized logically within `src/components`.
*   **Data Fetching**: All client-side data fetching from the Kubernetes API should be done through the `useK8sResourceList` and `useK8sResourceDetail` hooks found in `src/hooks/useK8sResource.ts`.
*   **API Routes**: Backend logic is handled in the Next.js API routes located in `src/app/api/k8s`. These routes use the services from `src/lib/k8s` to interact with the cluster.
*   **Testing**: No testing framework or existing tests were identified during the analysis. If adding new features, tests should be added.
