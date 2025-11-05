import {
  V1Container,
  V1ContainerStatus,
  V1Pod,
  V1Volume,
} from '@kubernetes/client-node'
import { aggregateContainerResources } from '../utils/resources'
import { PodDetail, PodContainer, PodSummary, PodVolume } from '../types/pod'
import { Condition } from '../types/common'

// 这是一个简化的状态计算逻辑，未来可以做得更复杂
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

function getContainerRestarts(pod: V1Pod): number {
  return (pod.status?.containerStatuses || []).reduce(
    (sum, cs) => sum + (cs.restartCount ?? 0),
    0,
  )
}

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
export function transformPodToDetail(pod: V1Pod): PodDetail {
  const summary = transformPodToSummary(pod)

  const containerStatuses = pod.status?.containerStatuses || []

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

  const volumes: PodVolume[] = (pod.spec?.volumes || []).map((v) => ({
    name: v.name,
    type: resolveVolumeType(v),
  }))

  return {
    ...summary,
    labels: pod.metadata?.labels || {},
    annotations: pod.metadata?.annotations || {},
    containers,
    volumes,
    conditions: (pod.status?.conditions || []).map((c) => ({
      type: c.type,
      status: c.status as Condition['status'],
      reason: c.reason || '',
      message: c.message || '',
      lastUpdateTime:
        c.lastTransitionTime?.toISOString() || summary.creationTimestamp,
    })),
  }
}
