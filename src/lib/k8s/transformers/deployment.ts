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
    conditions: toConditions(deployment.status?.conditions),
    containers,
    pods: undefined,
  }
}
