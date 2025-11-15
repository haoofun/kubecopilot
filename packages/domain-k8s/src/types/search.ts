/**
 * Represents a single search match so the observability board can deep-link operators to the right Kubernetes object.
 */
export interface GlobalSearchResult {
  /** kind indicates the Kubernetes resource type (Pod, Service, etc.) to display proper icons. */
  kind: string
  /** name is the `metadata.name` surfaced so users recognize the resource. */
  name: string
  /** namespace scopes the match when applicable, mirroring `metadata.namespace`. */
  namespace?: string | null
  /** description provides contextual text such as readiness or owner derived from the underlying object. */
  description?: string
  /** href forms the dashboard URL pointing to the resource detail panel. */
  href: string
  /** uid ensures the search panel can dedupe results and matches `metadata.uid`. */
  uid: string
}

/**
 * Response payload for the global search bar, echoing the query and result set powering the observability experience.
 */
export interface GlobalSearchResponse {
  /** query is the raw search string typed by the operator. */
  query: string
  /** items contains each matching resource with Kubernetes metadata to jump into drills. */
  items: GlobalSearchResult[]
}
