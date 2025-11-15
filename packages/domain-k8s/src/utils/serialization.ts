/**
 * Produces a plain JSON-safe clone so the observability board can stash Kubernetes objects in Next.js props without prototype issues.
 */
export function toSerializable<T>(value: T): T {
  return value == null ? value : (JSON.parse(JSON.stringify(value)) as T)
}
