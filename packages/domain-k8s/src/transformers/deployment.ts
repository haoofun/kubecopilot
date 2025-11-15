import type {
  V1Container,
  V1Deployment,
  V1DeploymentCondition,
} from '@kubernetes/client-node'

import type { Condition } from '../types/common'
import type {
  DeploymentDetail,
  DeploymentSummary,
  DeploymentStrategy,
} from '../types/deployment'
import type { PodContainer } from '../types/pod'

/** Normalizes the Deployment strategy block so the observability board can explain rollout knobs alongside status. */
const toDeploymentStrategy = (deployment: V1Deployment): DeploymentStrategy => {
  const strategy = deployment.spec?.strategy
  if (!strategy) {
    return {
      type: 'RollingUpdate',
    }
  }

  return {
    type: strategy.type ?? 'RollingUpdate',
    rollingUpdate: strategy.rollingUpdate
      ? {
          maxUnavailable: strategy.rollingUpdate.maxUnavailable,
          maxSurge: strategy.rollingUpdate.maxSurge,
        }
      : undefined,
  }
}

/** Converts Deployment template containers into the shared PodContainer shape for previewing specs on the dashboard. */
const toPodContainers = (
  containers: V1Container[] | undefined,
): PodContainer[] =>
  (containers ?? []).map((container) => ({
    name: container.name,
    image: container.image ?? '',
    status: undefined,
    restarts: 0,
    ports: (container.ports || []).map((p) => ({
      name: p.name,
      containerPort: p.containerPort,
      protocol: p.protocol ?? 'TCP',
    })),
    env: (container.env || []).map((e) => ({
      name: e.name ?? '',
      value: e.value ?? '',
    })),
    volumeMounts: (container.volumeMounts || []).map((mount) => ({
      name: mount.name ?? '',
      mountPath: mount.mountPath ?? '',
      readOnly: mount.readOnly ?? undefined,
    })),
    resources: {
      requests: {
        cpu: container.resources?.requests?.cpu
          ? String(container.resources.requests.cpu)
          : undefined,
        memory: container.resources?.requests?.memory
          ? String(container.resources.requests.memory)
          : undefined,
      },
      limits: {
        cpu: container.resources?.limits?.cpu
          ? String(container.resources.limits.cpu)
          : undefined,
        memory: container.resources?.limits?.memory
          ? String(container.resources.limits.memory)
          : undefined,
      },
    },
    lastState: undefined,
  }))

/** Maps raw Deployment conditions into the board's generic condition structure for health badges. */
const toConditions = (
  conditions: V1DeploymentCondition[] | undefined,
): Condition[] =>
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '',
    status: condition.status ?? '',
    reason: condition.reason ?? '',
    message: condition.message ?? '',
    lastUpdateTime:
      condition.lastUpdateTime?.toISOString() ??
      condition.lastTransitionTime?.toISOString() ??
      '',
  }))

/** Builds the DeploymentSummary consumed by namespace lists within the observability board. */
export const transformDeploymentToSummary = (
  deployment: V1Deployment,
): DeploymentSummary => ({
  uid: deployment.metadata?.uid ?? '',
  name: deployment.metadata?.name ?? '',
  namespace: deployment.metadata?.namespace ?? '',
  readyReplicas: deployment.status?.readyReplicas ?? 0,
  desiredReplicas: deployment.spec?.replicas ?? 0,
  updatedReplicas: deployment.status?.updatedReplicas ?? 0,
  availableReplicas: deployment.status?.availableReplicas ?? 0,
  creationTimestamp:
    deployment.metadata?.creationTimestamp?.toISOString() ?? '',
})

/**
 * Produces the DeploymentDetail payload so the board can render metadata, strategy, selectors, and template containers.
 */
export const transformDeploymentToDetail = (
  deployment: V1Deployment,
): DeploymentDetail => {
  const summary = transformDeploymentToSummary(deployment)

  const ownerRef = deployment.metadata?.ownerReferences?.[0]
  const selector = deployment.spec?.selector?.matchLabels ?? null
  const containers = toPodContainers(
    deployment.spec?.template?.spec?.containers,
  )

  return {
    ...summary,
    labels: deployment.metadata?.labels ?? {},
    annotations: deployment.metadata?.annotations ?? {},
    owner: ownerRef
      ? {
          kind: ownerRef.kind ?? '',
          name: ownerRef.name ?? '',
          uid: ownerRef.uid ?? '',
        }
      : null,
    strategy: toDeploymentStrategy(deployment),
    selector,
    templateLabels: deployment.spec?.template?.metadata?.labels ?? {},
    templateAnnotations: deployment.spec?.template?.metadata?.annotations ?? {},
    minReadySeconds: deployment.spec?.minReadySeconds ?? undefined,
    progressDeadlineSeconds:
      deployment.spec?.progressDeadlineSeconds ?? undefined,
    revisionHistoryLimit: deployment.spec?.revisionHistoryLimit ?? undefined,
    paused: deployment.spec?.paused ?? undefined,
    conditions: toConditions(deployment.status?.conditions),
    containers,
    pods: undefined,
  }
}
