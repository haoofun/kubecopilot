export interface IngressTLS {
  hosts: string[]
  secretName?: string
}

export interface IngressRulePath {
  path?: string
  pathType?: string
  backend: string
}

export interface IngressRuleSummary {
  host?: string
  paths: IngressRulePath[]
}

export interface IngressSummary {
  uid: string
  name: string
  namespace: string
  hosts: string[]
  serviceCount: number
  creationTimestamp: string
}

export interface IngressDetail extends IngressSummary {
  labels: Record<string, string>
  annotations: Record<string, string>
  tls: IngressTLS[]
  rules: IngressRuleSummary[]
  defaultBackend?: string
}
