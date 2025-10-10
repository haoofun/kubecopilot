/**
 * Implements a truly singleton in-memory session store that persists across
 * Next.js hot reloads in development.
 */
declare global {
  var __sessionStore: Map<string, string> | undefined
}

const sessionStore: Map<string, string> =
  globalThis.__sessionStore ?? new Map<string, string>()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__sessionStore = sessionStore
}

export { sessionStore }
