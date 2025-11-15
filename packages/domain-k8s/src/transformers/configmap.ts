import type { V1ConfigMap } from '@kubernetes/client-node'

import type { ConfigMapDetail, ConfigMapSummary } from '../types/configmap'

/** Converts a Kubernetes ConfigMap into the summary consumed by the observability board's config inventory. */
export const transformConfigMapToSummary = (
  configMap: V1ConfigMap,
): ConfigMapSummary => ({
  uid: configMap.metadata?.uid ?? '',
  name: configMap.metadata?.name ?? '',
  namespace: configMap.metadata?.namespace ?? '',
  dataCount: Object.keys(configMap.data ?? {}).length,
  creationTimestamp: configMap.metadata?.creationTimestamp?.toISOString() ?? '',
})

/**
 * Produces a ConfigMapDetail so the board can render metadata plus the actual key/value payloads when troubleshooting.
 */
export const transformConfigMapToDetail = (
  configMap: V1ConfigMap,
): ConfigMapDetail => {
  const summary = transformConfigMapToSummary(configMap)

  return {
    ...summary,
    labels: configMap.metadata?.labels ?? {},
    annotations: configMap.metadata?.annotations ?? {},
    data: configMap.data ?? {},
    binaryData: configMap.binaryData ?? {},
  }
}
