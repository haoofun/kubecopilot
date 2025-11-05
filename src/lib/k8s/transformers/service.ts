import type {
  V1EndpointAddress,
  V1EndpointSubset,
  V1Endpoints,
  V1Service,
  V1ServicePort,
} from '@kubernetes/client-node'

import type { ServiceDetail, ServiceSummary } from '../types/service'

const toExternalIPs = (service: V1Service): string[] => {
  const specExternal = service.spec?.externalIPs ?? []
  const lbIngress =
    service.status?.loadBalancer?.ingress?.map(
      (ingress) => ingress.ip ?? ingress.hostname ?? '',
    ) ?? []

  const combined = [...specExternal, ...lbIngress].filter(
    (value): value is string => !!value && value.trim().length > 0,
  )

  return Array.from(new Set(combined))
}

const formatPortSummary = (port: V1ServicePort): string => {
  const protocol = port.protocol ?? 'TCP'
  const target = port.targetPort ?? port.port
  const nodePort = port.nodePort ? ` (NodePort:${port.nodePort})` : ''
  return `${port.port}:${target}/${protocol}${nodePort}`
}

const toEndpointEntries = (
  subset: V1EndpointSubset,
): Array<{ address: V1EndpointAddress; ready: boolean }> => {
  const ready = (subset.addresses ?? []).map((address) => ({
    address,
    ready: true,
  }))
  const notReady = (subset.notReadyAddresses ?? []).map((address) => ({
    address,
    ready: false,
  }))
  return [...ready, ...notReady]
}

const buildEndpoints = (
  endpoints: V1Endpoints | undefined,
): ServiceDetail['endpoints'] => {
  if (!endpoints?.subsets) {
    return []
  }

  const results: ServiceDetail['endpoints'] = []

  for (const subset of endpoints.subsets) {
    for (const { address, ready } of toEndpointEntries(subset)) {
      results.push({
        ip: address.ip ?? '',
        nodeName: address.nodeName ?? null,
        ready,
        target: address.targetRef
          ? {
              kind: address.targetRef.kind ?? '',
              name: address.targetRef.name ?? '',
              uid: address.targetRef.uid ?? '',
            }
          : null,
      })
    }
  }

  return results
}

export const transformServiceToSummary = (
  service: V1Service,
): ServiceSummary => ({
  uid: service.metadata?.uid ?? '',
  name: service.metadata?.name ?? '',
  namespace: service.metadata?.namespace ?? '',
  type: service.spec?.type ?? 'ClusterIP',
  clusterIP: service.spec?.clusterIP ?? '',
  externalIPs: toExternalIPs(service),
  ports: (service.spec?.ports ?? []).map(formatPortSummary),
  creationTimestamp: service.metadata?.creationTimestamp?.toISOString() ?? '',
})

export const transformServiceToDetail = (
  service: V1Service,
  endpoints?: V1Endpoints | null,
): ServiceDetail => {
  const summary = transformServiceToSummary(service)

  return {
    ...summary,
    labels: service.metadata?.labels ?? {},
    annotations: service.metadata?.annotations ?? {},
    selector: service.spec?.selector ?? null,
    sessionAffinity: service.spec?.sessionAffinity ?? 'None',
    sessionAffinityConfig: service.spec?.sessionAffinityConfig?.clientIP
      ? {
          clientIPTimeoutSeconds:
            service.spec?.sessionAffinityConfig?.clientIP?.timeoutSeconds ??
            undefined,
        }
      : undefined,
    fullPorts: (service.spec?.ports ?? []).map((port) => ({
      name: port.name ?? '',
      port: port.port ?? 0,
      targetPort: port.targetPort ?? 0,
      protocol: port.protocol ?? 'TCP',
      nodePort: port.nodePort ?? 0,
    })),
    endpoints: buildEndpoints(endpoints ?? undefined),
  }
}
