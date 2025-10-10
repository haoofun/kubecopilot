import { NextResponse, NextRequest } from 'next/server'
import { getK8sCoreV1Api } from '@/lib/k8s/client'
import { V1Service, V1ServicePort } from '@kubernetes/client-node'

// 辅助函数，用于将端口信息格式化为可读字符串
function formatPorts(ports: V1ServicePort[] | undefined): string {
  if (!ports || ports.length === 0) {
    return 'N/A'
  }
  return ports
    .map((p) => `${p.port}:${p.targetPort || 'N/A'}/${p.protocol || 'TCP'}`)
    .join(', ')
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('k8s-session-id')?.value
    const k8sApi = getK8sCoreV1Api(sessionId)

    // 调用 K8s API 获取所有命名空间下的 Services
    const res = await k8sApi.listServiceForAllNamespaces()
    const services = res.items

    // 格式化数据
    const formattedServices = services.map((svc: V1Service) => ({
      name: svc.metadata?.name || 'N/A',
      namespace: svc.metadata?.namespace || 'N/A',
      type: svc.spec?.type || 'N/A',
      clusterIP: svc.spec?.clusterIP || 'N/A',
      ports: formatPorts(svc.spec?.ports),
      age: svc.metadata?.creationTimestamp,
    }))

    return NextResponse.json(formattedServices)
  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error(`[SERVICES API ERROR] ${errorMessage}`)
    return NextResponse.json(
      { message: 'Failed to fetch services.', error: errorMessage },
      { status: 401 },
    )
  }
}
