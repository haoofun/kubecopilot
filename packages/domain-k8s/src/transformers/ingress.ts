import type { V1Ingress, V1IngressRule } from '@kubernetes/client-node'

import type { IngressDetail, IngressSummary } from '../types/ingress'

/** Normalizes ingress rules into host/path/backend tuples so the board can render routing tables. */
const formatBackend = (
  rule: V1IngressRule,
): {
  host?: string
  paths: { path?: string; pathType?: string; backend: string }[]
} => {
  const paths =
    rule.http?.paths?.map((path) => ({
      path: path.path ?? undefined,
      pathType: path.pathType ?? undefined,
      backend: path.backend?.service
        ? `${path.backend.service.name}:${path.backend.service.port?.number ?? path.backend.service.port?.name ?? ''}`
        : (path.backend?.resource?.name ?? '—'),
    })) ?? []

  return {
    host: rule.host ?? undefined,
    paths,
  }
}

/** Collects unique hostnames from the ingress spec for display in exposure summaries. */
const collectHosts = (ingress: V1Ingress): string[] => {
  const hosts =
    ingress.spec?.rules
      ?.map((rule) => rule.host)
      .filter(
        (host): host is string => typeof host === 'string' && host.length > 0,
      ) ?? []
  return Array.from(new Set(hosts))
}

/** Counts distinct backend services so the observability board can show blast radius for each ingress. */
const countServices = (ingress: V1Ingress): number => {
  const names = new Set<string>()
  ingress.spec?.rules?.forEach((rule) => {
    rule.http?.paths?.forEach((path) => {
      const svcName = path.backend?.service?.name
      if (svcName) {
        names.add(svcName)
      }
    })
  })

  if (ingress.spec?.defaultBackend?.service?.name) {
    names.add(ingress.spec.defaultBackend.service.name)
  }

  return names.size
}

/** Produces the IngressSummary rows for the networking section of the dashboard. */
export const transformIngressToSummary = (
  ingress: V1Ingress,
): IngressSummary => ({
  uid: ingress.metadata?.uid ?? '',
  name: ingress.metadata?.name ?? '',
  namespace: ingress.metadata?.namespace ?? '',
  hosts: collectHosts(ingress),
  serviceCount: countServices(ingress),
  creationTimestamp: ingress.metadata?.creationTimestamp?.toISOString() ?? '',
})

/**
 * Builds the full IngressDetail with TLS blocks, rules, and default backend so the board can explain traffic routing.
 */
export const transformIngressToDetail = (ingress: V1Ingress): IngressDetail => {
  const summary = transformIngressToSummary(ingress)

  return {
    ...summary,
    labels: ingress.metadata?.labels ?? {},
    annotations: ingress.metadata?.annotations ?? {},
    tls:
      ingress.spec?.tls?.map((entry) => ({
        hosts: entry.hosts ?? [],
        secretName: entry.secretName ?? undefined,
      })) ?? [],
    rules: ingress.spec?.rules?.map((rule) => formatBackend(rule)) ?? [],
    defaultBackend: ingress.spec?.defaultBackend?.service?.name
      ? `${ingress.spec.defaultBackend.service.name}:${ingress.spec.defaultBackend.service.port?.number ?? ingress.spec.defaultBackend.service.port?.name ?? ''}`
      : undefined,
  }
}
