import {
  V1Container,
  V1ContainerStatus,
  V1Pod,
  V1Volume,
} from '@kubernetes/client-node'
import { aggregateContainerResources } from '../utils/resources'
import { PodDetail, PodContainer, PodSummary, PodVolume } from '../types/pod'
import { Condition } from '../types/common'
import type { PodToleration } from '../types/pod'

// 这是一个简化的状态计算逻辑，未来可以做得更复杂
/**
 * Collapses raw pod phases and container readiness into a single status string so the observability board can colorize rows quickly.
 */
function calculatePodStatus(pod: V1Pod): PodSummary['status'] {
  if (!pod.status || !pod.status.phase) return 'Unknown'

  const phase = pod.status.phase
  if (phase === 'Running' || phase === 'Succeeded') {
    const containerStatuses = pod.status.containerStatuses || []
    const isReady = containerStatuses.every((cs) => cs.ready)
    return isReady ? 'Running' : 'Pending'
  }

  return phase as PodSummary['status']
}

/** Totals container restart counts to let the board surface instability heatmaps straight from Kubernetes pod status. */
function getContainerRestarts(pod: V1Pod): number {
  return (pod.status?.containerStatuses || []).reduce(
    (sum, cs) => sum + (cs.restartCount ?? 0),
    0,
  )
}

/** Converts the verbose container state object into a friendly string for the board's container table. */
function deriveContainerState(status?: V1ContainerStatus): string | undefined {
  const state = status?.state
  if (!state) return undefined

  if (state.running) {
    return 'Running'
  }

  if (state.terminated) {
    return state.terminated.reason || 'Terminated'
  }

  if (state.waiting) {
    return state.waiting.reason || 'Waiting'
  }

  return undefined
}

/** Pulls resource request/limit strings from the pod template so the dashboard can show per-container budgets. */
function extractContainerResources(container: V1Container) {
  const requestsCpu = container.resources?.requests?.cpu
  const requestsMemory = container.resources?.requests?.memory
  const limitsCpu = container.resources?.limits?.cpu
  const limitsMemory = container.resources?.limits?.memory

  return {
    requests: {
      cpu: requestsCpu ? String(requestsCpu) : undefined,
      memory: requestsMemory ? String(requestsMemory) : undefined,
    },
    limits: {
      cpu: limitsCpu ? String(limitsCpu) : undefined,
      memory: limitsMemory ? String(limitsMemory) : undefined,
    },
  }
}

/** Extracts the lastState payload so the board can surface recent crashes alongside current status. */
function deriveLastState(status?: V1ContainerStatus) {
  const lastState = status?.lastState
  if (!lastState) return undefined

  if (lastState.terminated) {
    return {
      phase: 'Terminated' as const,
      reason: lastState.terminated.reason ?? undefined,
      message: lastState.terminated.message ?? undefined,
      finishedAt: lastState.terminated.finishedAt?.toISOString(),
    }
  }

  if (lastState.waiting) {
    return {
      phase: 'Waiting' as const,
      reason: lastState.waiting.reason ?? undefined,
      message: lastState.waiting.message ?? undefined,
    }
  }

  return undefined
}

const VOLUME_TYPE_LABELS: Record<string, string> = {
  configMap: 'ConfigMap',
  secret: 'Secret',
  persistentVolumeClaim: 'PersistentVolumeClaim',
  emptyDir: 'EmptyDir',
  hostPath: 'HostPath',
  projected: 'Projected',
  downwardAPI: 'DownwardAPI',
  nfs: 'NFS',
  csi: 'CSI',
  ephemeral: 'Ephemeral',
}

/** Maps volume definitions to a human label, helping the board describe how data enters the pod. */
const resolveVolumeType = (volume: V1Volume): string => {
  const entry = Object.entries(volume).find(
    ([key, value]) => key !== 'name' && value !== undefined && value !== null,
  )
  if (!entry) {
    return 'Unknown'
  }
  const [key] = entry
  return VOLUME_TYPE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

// 将原始 V1Pod 转换为我们定义的 PodSummary
/**
 * Converts a raw Kubernetes Pod into the lightweight summary consumed by the observability board's namespace tables.
 */
export function transformPodToSummary(pod: V1Pod): PodSummary {
  const ownerRef = pod.metadata?.ownerReferences?.[0]
  const containers = pod.spec?.containers || []

  return {
    uid: pod.metadata?.uid ?? '',
    name: pod.metadata?.name ?? '',
    namespace: pod.metadata?.namespace ?? '',
    status: calculatePodStatus(pod),
    restarts: getContainerRestarts(pod),
    resources: aggregateContainerResources(containers),
    nodeName: pod.spec?.nodeName || null,
    creationTimestamp: pod.metadata?.creationTimestamp?.toISOString() ?? '',
    ip: pod.status?.podIP || '',
    owner: ownerRef
      ? {
          kind: ownerRef.kind ?? '',
          name: ownerRef.name ?? '',
          uid: ownerRef.uid ?? '',
        }
      : null,
  }
}

// 将原始 V1Pod 转换为我们定义的 PodDetail
/**
 * Builds the rich PodDetail structure so the board can render container breakdowns, volumes, and conditions alongside telemetry.
 */
export function transformPodToDetail(pod: V1Pod): PodDetail {
  const summary = transformPodToSummary(pod)

  const containerStatuses = pod.status?.containerStatuses || []
  const initContainerStatuses = pod.status?.initContainerStatuses || []

  const containers: PodContainer[] = (pod.spec?.containers || []).map((c) => {
    const matchingStatus = containerStatuses.find((cs) => cs.name === c.name)

    return {
      name: c.name,
      image: c.image ?? '',
      status: deriveContainerState(matchingStatus),
      restarts: matchingStatus?.restartCount ?? 0,
      ports: (c.ports || []).map((p) => ({
        name: p.name,
        containerPort: p.containerPort,
        protocol: p.protocol ?? 'TCP',
      })),
      env: (c.env || []).map((e) => ({
        name: e.name ?? '',
        value: e.value ?? '',
      })),
      volumeMounts: (c.volumeMounts || []).map((vm) => ({
        name: vm.name ?? '',
        mountPath: vm.mountPath ?? '',
        readOnly: vm.readOnly ?? undefined,
      })),
      resources: extractContainerResources(c),
      lastState: deriveLastState(matchingStatus),
    }
  })

  const initContainers: PodContainer[] = (pod.spec?.initContainers || []).map(
    (container) => {
      const matchingStatus = initContainerStatuses.find(
        (status) => status.name === container.name,
      )

      return {
        name: container.name,
        image: container.image ?? '',
        status: deriveContainerState(matchingStatus),
        restarts: matchingStatus?.restartCount ?? 0,
        ports: (container.ports || []).map((p) => ({
          name: p.name,
          containerPort: p.containerPort,
          protocol: p.protocol ?? 'TCP',
        })),
        env: (container.env || []).map((e) => ({
          name: e.name ?? '',
          value: e.value ?? '',
        })),
        volumeMounts: (container.volumeMounts || []).map((vm) => ({
          name: vm.name ?? '',
          mountPath: vm.mountPath ?? '',
          readOnly: vm.readOnly ?? undefined,
        })),
        resources: extractContainerResources(container),
        lastState: deriveLastState(matchingStatus),
      }
    },
  )

  const volumes: PodVolume[] = (pod.spec?.volumes || []).map((v) => ({
    name: v.name,
    type: resolveVolumeType(v),
  }))

  const tolerations: PodToleration[] = (pod.spec?.tolerations || []).map(
    (toleration) => ({
      key: toleration.key ?? undefined,
      operator: toleration.operator ?? undefined,
      value: toleration.value ?? undefined,
      effect: toleration.effect ?? undefined,
      tolerationSeconds: toleration.tolerationSeconds ?? undefined,
    }),
  )

  const imagePullSecrets: string[] = (pod.spec?.imagePullSecrets || [])
    .map((entry) => entry.name)
    .filter((name): name is string => Boolean(name))

  const podIPs = (pod.status?.podIPs || [])
    .map((entry) => entry.ip)
    .filter((ip): ip is string => Boolean(ip))
  if (podIPs.length === 0 && pod.status?.podIP) {
    podIPs.push(pod.status.podIP)
  }

  const startTime = pod.status?.startTime
    ? pod.status.startTime instanceof Date
      ? pod.status.startTime.toISOString()
      : pod.status.startTime
    : undefined

  return {
    ...summary,
    labels: pod.metadata?.labels || {},
    annotations: pod.metadata?.annotations || {},
    containers,
    initContainers,
    volumes,
    conditions: (pod.status?.conditions || []).map((c) => ({
      type: c.type,
      status: c.status as Condition['status'],
      reason: c.reason || '',
      message: c.message || '',
      lastUpdateTime:
        c.lastTransitionTime?.toISOString() || summary.creationTimestamp,
    })),
    serviceAccountName: pod.spec?.serviceAccountName ?? undefined,
    priorityClassName: pod.spec?.priorityClassName ?? undefined,
    nodeSelector: pod.spec?.nodeSelector || {},
    tolerations,
    imagePullSecrets,
    dnsPolicy: pod.spec?.dnsPolicy ?? undefined,
    hostNetwork: pod.spec?.hostNetwork ?? undefined,
    hostPID: pod.spec?.hostPID ?? undefined,
    hostIPC: pod.spec?.hostIPC ?? undefined,
    qosClass: pod.status?.qosClass ?? undefined,
    podIPs,
    hostIP: pod.status?.hostIP ?? undefined,
    startTime,
    phase: pod.status?.phase ?? undefined,
  }
}
