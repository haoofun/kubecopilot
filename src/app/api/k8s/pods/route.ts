import { NextResponse, NextRequest } from 'next/server'
import { getK8sCoreV1Api } from '@/lib/k8s/client'
import { V1Pod } from '@kubernetes/client-node'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('k8s-session-id')?.value
    const k8sApi = getK8sCoreV1Api(sessionId)

    // 调用 K8s API 获取所有命名空间下的 Pod
    const res = await k8sApi.listPodForAllNamespaces()
    const pods = res.items

    // 格式化数据，提取前端所需的核心信息
    const formattedPods = pods.map((pod: V1Pod) => {
      // 复杂的 Pod 状态计算逻辑
      let status = 'Unknown'
      if (pod.status?.phase) {
        status = pod.status.phase
      }
      if (pod.status?.containerStatuses) {
        const waiting = pod.status.containerStatuses.find(
          (s) => s.state?.waiting,
        )
        if (waiting && waiting.state?.waiting?.reason) {
          status = waiting.state.waiting.reason
        }
        const terminated = pod.status.containerStatuses.find(
          (s) => s.state?.terminated,
        )
        if (terminated && terminated.state?.terminated?.reason) {
          status = terminated.state.terminated.reason
        }
      }

      return {
        name: pod.metadata?.name || 'N/A',
        namespace: pod.metadata?.namespace || 'N/A',
        status: status,
        restarts:
          pod.status?.containerStatuses?.reduce(
            (acc, cur) => acc + cur.restartCount,
            0,
          ) || 0,
        age: pod.metadata?.creationTimestamp,
      }
    })

    return NextResponse.json(formattedPods)
  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error(`[PODS API ERROR] ${errorMessage}`)
    return NextResponse.json(
      { message: 'Failed to fetch pods.', error: errorMessage },
      { status: 401 },
    )
  }
}
