import { NextResponse, NextRequest } from 'next/server'
import { getK8sAppsV1Api } from '@/lib/k8s/client' // <--- 导入正确的函数
import { V1Deployment } from '@kubernetes/client-node'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('k8s-session-id')?.value

    // 调用新的、正确的函数来获取 AppsV1Api 客户端
    const k8sApi = getK8sAppsV1Api(sessionId)

    const res = await k8sApi.listDeploymentForAllNamespaces()
    const deployments = res.items

    const formattedDeployments = deployments.map((dep: V1Deployment) => ({
      name: dep.metadata?.name || 'N/A',
      namespace: dep.metadata?.namespace || 'N/A',
      ready: `${dep.status?.readyReplicas || 0}/${dep.spec?.replicas || 0}`,
      upToDate: dep.status?.updatedReplicas || 0,
      available: dep.status?.availableReplicas || 0,
      age: dep.metadata?.creationTimestamp,
    }))

    return NextResponse.json(formattedDeployments)
  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error(`[DEPLOYMENTS API ERROR] ${errorMessage}`)
    return NextResponse.json(
      { message: 'Failed to fetch deployments.', error: errorMessage },
      { status: 401 },
    )
  }
}
