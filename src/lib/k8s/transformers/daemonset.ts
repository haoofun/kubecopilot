import type { V1DaemonSet, V1DaemonSetCondition } from '@kubernetes/client-node'

import type { Condition } from '../types/common'
import type {
  DaemonSetDetail,
  DaemonSetSummary,
  DaemonSetUpdateStrategy,
} from '../types/daemonset'

const toStrategy = (daemonSet: V1DaemonSet): DaemonSetUpdateStrategy => ({
  type: daemonSet.spec?.updateStrategy?.type ?? 'RollingUpdate',
  rollingUpdate: daemonSet.spec?.updateStrategy?.rollingUpdate
    ? {
        maxUnavailable:
          daemonSet.spec.updateStrategy.rollingUpdate.maxUnavailable,
      }
    : undefined,
})

const toConditions = (
  conditions: V1DaemonSetCondition[] | undefined,
): Condition[] =>
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '',
    status: condition.status ?? '',
    reason: condition.reason ?? '',
    message: condition.message ?? '',
    lastUpdateTime: condition.lastTransitionTime?.toISOString() ?? '',
  }))

export const transformDaemonSetToSummary = (
  daemonSet: V1DaemonSet,
): DaemonSetSummary => ({
  uid: daemonSet.metadata?.uid ?? '',
  name: daemonSet.metadata?.name ?? '',
  namespace: daemonSet.metadata?.namespace ?? '',
  desiredPods: daemonSet.status?.desiredNumberScheduled ?? 0,
  currentPods: daemonSet.status?.currentNumberScheduled ?? 0,
  readyPods: daemonSet.status?.numberReady ?? 0,
  updatedPods: daemonSet.status?.updatedNumberScheduled ?? 0,
  creationTimestamp: daemonSet.metadata?.creationTimestamp?.toISOString() ?? '',
})

export const transformDaemonSetToDetail = (
  daemonSet: V1DaemonSet,
): DaemonSetDetail => {
  const summary = transformDaemonSetToSummary(daemonSet)

  return {
    ...summary,
    labels: daemonSet.metadata?.labels ?? {},
    annotations: daemonSet.metadata?.annotations ?? {},
    selector: daemonSet.spec?.selector?.matchLabels ?? null,
    strategy: toStrategy(daemonSet),
    conditions: toConditions(daemonSet.status?.conditions),
    nodeSelector: daemonSet.spec?.template?.spec?.nodeSelector ?? {},
    tolerations:
      daemonSet.spec?.template?.spec?.tolerations?.map((t) => ({
        key: t.key ?? undefined,
        operator: t.operator ?? undefined,
        value: t.value ?? undefined,
        effect: t.effect ?? undefined,
      })) ?? [],
  }
}
