// lib/k8s/utils/status.ts
import { V1Pod, V1Service } from '@kubernetes/client-node'

export function getPodStatus(pod: V1Pod): string {
  const phase = pod.status?.phase || 'Unknown'
  const containerStatuses = pod.status?.containerStatuses || []
  const initContainerStatuses = pod.status?.initContainerStatuses || []

  // 处理 Init 容器状态
  for (const initStatus of initContainerStatuses) {
    if (initStatus.state?.waiting?.reason) {
      return `Init:${initStatus.state.waiting.reason}`
    }
    if (initStatus.state?.terminated) {
      const { exitCode, reason } = initStatus.state.terminated
      if (exitCode !== 0) {
        return `Init:${reason || 'Error'}`
      }
    }
  }

  // 处理主容器状态 - 优先显示错误状态
  for (const status of containerStatuses) {
    // Terminated 状态（失败优先）
    if (status.state?.terminated) {
      const { exitCode, reason, signal } = status.state.terminated
      if (exitCode !== 0) {
        return reason || `Error:${signal || exitCode}`
      }
    }
  }

  // Waiting 状态
  for (const status of containerStatuses) {
    if (status.state?.waiting?.reason) {
      return status.state.waiting.reason
    }
  }

  // 检查容器就绪状态
  if (phase === 'Running') {
    const totalContainers = containerStatuses.length
    const readyContainers = containerStatuses.filter((s) => s.ready).length

    if (readyContainers < totalContainers) {
      return `NotReady (${readyContainers}/${totalContainers})`
    }
  }

  return phase
}

export function getServiceStatus(svc: V1Service): string {
  const conditions = svc.status?.conditions || []
  const readyCount = conditions.filter(
    (c) => c.type === 'Ready' && c.status === 'True',
  ).length
  const totalCount = svc.spec?.ports?.length || 0

  if (readyCount < totalCount) {
    return 'NotReady'
  }

  return 'Running'
}
