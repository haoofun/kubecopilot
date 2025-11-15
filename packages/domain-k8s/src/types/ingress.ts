/**
 * TLS configuration so the observability board can highlight which hosts are secured and which Secret backs them.
 */
export interface IngressTLS {
  /** hosts lists the domains covered by this certificate, mirroring `spec.tls[].hosts`. */
  hosts: string[]
  /** secretName references the Kubernetes Secret storing the cert (`spec.tls[].secretName`). */
  secretName?: string
}

/**
 * Describes a single HTTP path mapping so the dashboard can show how traffic routes to services.
 */
export interface IngressRulePath {
  /** path is the URL prefix from `spec.rules[].http.paths[].path`. */
  path?: string
  /** pathType indicates Exact, Prefix, or ImplementationSpecific from the same Kubernetes field. */
  pathType?: string
  /** backend contains a simplified `serviceName:port` summary referencing the Kubernetes backend target. */
  backend: string
}

/**
 * Aggregated rule per host for display, derived from Kubernetes ingress rules.
 */
export interface IngressRuleSummary {
  /** host is the domain (from `spec.rules[].host`) used for grouping. */
  host?: string
  /** paths contains each HTTP path definition described above. */
  paths: IngressRulePath[]
}

/**
 * High-level Ingress info so the observability board can show exposure points per namespace.
 */
export interface IngressSummary {
  /** UID uniquely identifies the Ingress derived from `metadata.uid`. */
  uid: string
  /** name equals `metadata.name` for table display. */
  name: string
  /** namespace scopes the resource (`metadata.namespace`). */
  namespace: string
  /** hosts enumerates externally reachable domains taken from rules and default backends. */
  hosts: string[]
  /** serviceCount tallies unique backend services this ingress touches, helping gauge blast radius. */
  serviceCount: number
  /** creationTimestamp indicates when exposure was created, mirroring `metadata.creationTimestamp`. */
  creationTimestamp: string
}

/**
 * Full ingress detail including metadata, TLS secrets, routing rules, and default backend info.
 */
export interface IngressDetail extends IngressSummary {
  /** labels drawn from `metadata.labels` support filtering by environment. */
  labels: Record<string, string>
  /** annotations capture ingress controller settings from `metadata.annotations`. */
  annotations: Record<string, string>
  /** tls lists TLS blocks from the spec so certificate coverage is visible. */
  tls: IngressTLS[]
  /** rules expands every host/path entry to explain routing behavior. */
  rules: IngressRuleSummary[]
  /** defaultBackend surfaces the fallback service defined in `spec.defaultBackend`. */
  defaultBackend?: string
}
