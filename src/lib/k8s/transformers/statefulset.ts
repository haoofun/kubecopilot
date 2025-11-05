import type {
  V1PersistentVolumeClaim,
  V1StatefulSet,
  V1StatefulSetCondition,
} from '@kubernetes/client-node'

import type { Condition } from '../types/common'
import type {
  StatefulSetDetail,
  StatefulSetSummary,
  StatefulSetUpdateStrategy,
  VolumeClaimTemplate,
} from '../types/statefulset'

const toStrategy = (statefulSet: V1StatefulSet): StatefulSetUpdateStrategy => {
  const strategy = statefulSet.spec?.updateStrategy

  return {
    type: strategy?.type ?? 'RollingUpdate',
    rollingUpdate: strategy?.rollingUpdate
      ? {
          partition: strategy.rollingUpdate.partition ?? undefined,
        }
      : undefined,
  }
}

const toVolumeClaimTemplates = (
  templates: V1PersistentVolumeClaim[] | undefined,
): VolumeClaimTemplate[] =>
  (templates ?? []).map((pvc) => ({
    name: pvc.metadata?.name ?? '',
    storageClass: pvc.spec?.storageClassName ?? undefined,
    accessModes: pvc.spec?.accessModes ?? undefined,
    storage: pvc.spec?.resources?.requests?.storage
      ? String(pvc.spec.resources.requests.storage)
      : undefined,
  }))

const toConditions = (
  conditions: V1StatefulSetCondition[] | undefined,
): Condition[] =>
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '',
    status: condition.status ?? '',
    reason: condition.reason ?? '',
    message: condition.message ?? '',
    lastUpdateTime: condition.lastTransitionTime?.toISOString() ?? '',
  }))

export const transformStatefulSetToSummary = (
  statefulSet: V1StatefulSet,
): StatefulSetSummary => ({
  uid: statefulSet.metadata?.uid ?? '',
  name: statefulSet.metadata?.name ?? '',
  namespace: statefulSet.metadata?.namespace ?? '',
  desiredReplicas: statefulSet.spec?.replicas ?? 0,
  readyReplicas: statefulSet.status?.readyReplicas ?? 0,
  currentReplicas: statefulSet.status?.currentReplicas ?? 0,
  updatedReplicas: statefulSet.status?.updatedReplicas ?? 0,
  creationTimestamp:
    statefulSet.metadata?.creationTimestamp?.toISOString() ?? '',
})

export const transformStatefulSetToDetail = (
  statefulSet: V1StatefulSet,
): StatefulSetDetail => {
  const summary = transformStatefulSetToSummary(statefulSet)
  return {
    ...summary,
    labels: statefulSet.metadata?.labels ?? {},
    annotations: statefulSet.metadata?.annotations ?? {},
    serviceName: statefulSet.spec?.serviceName ?? null,
    selector: statefulSet.spec?.selector?.matchLabels ?? null,
    strategy: toStrategy(statefulSet),
    podManagementPolicy:
      statefulSet.spec?.podManagementPolicy ?? 'OrderedReady',
    volumeClaims: toVolumeClaimTemplates(
      statefulSet.spec?.volumeClaimTemplates,
    ),
    conditions: toConditions(statefulSet.status?.conditions),
  }
}
