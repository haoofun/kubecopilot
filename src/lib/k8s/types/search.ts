export interface GlobalSearchResult {
  kind: string
  name: string
  namespace?: string | null
  description?: string
  href: string
  uid: string
}

export interface GlobalSearchResponse {
  query: string
  items: GlobalSearchResult[]
}
