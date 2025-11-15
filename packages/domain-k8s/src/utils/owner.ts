// lib/k8s/utils/owner.ts
import type { KubernetesObject } from '@kubernetes/client-node'

/**
 * 获取资源的控制者（OwnerReference 的第一个条目），用于在可观测性看板上标注工作负载之间的层级关系。
 * 返回格式：Kind/Name，例如 "ReplicaSet/frontend-123".
 */
export function getControlledBy(resource: KubernetesObject): string {
  const ownerReferences = resource.metadata?.ownerReferences
  if (!ownerReferences || ownerReferences.length === 0) {
    return ''
  }

  const owner = ownerReferences[0]
  const kind = owner?.kind ?? ''
  const name = owner?.name ?? ''

  if (!kind || !name) {
    return ''
  }

  return `${kind}/${name}`
}
