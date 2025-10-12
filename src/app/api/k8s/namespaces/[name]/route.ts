import { NextResponse, NextRequest } from 'next/server'
import { getK8sCoreV1Api } from '@/lib/k8s/client'
import yaml from 'js-yaml'
import { V1Namespace } from '@kubernetes/client-node'

type Params = Promise<{ name: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const sessionId = request.cookies.get('k8s-session-id')?.value
    const { name } = await params
    const k8sCoreApi = getK8sCoreV1Api(sessionId)

    const nsDetail: V1Namespace = await k8sCoreApi.readNamespace({ name })
    const nsYaml = yaml.dump({
      ...nsDetail,
      metadata: { ...nsDetail.metadata, managedFields: undefined },
    })

    return NextResponse.json({
      detail: nsDetail,
      events: [], // 暂时返回空事件数组
      yaml: nsYaml,
    })
  } catch (error: unknown) {
    console.error(`[NAMESPACE DETAIL API ERROR]`, error)
    // 使用类型守卫来安全地处理错误
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      if (error.statusCode === 404) {
        return NextResponse.json(
          { message: `Namespace not found.`, error: String(error) },
          { status: 404 },
        )
      }
    }
    return NextResponse.json(
      { message: 'Failed to fetch namespace details.', error: String(error) },
      { status: 500 },
    )
  }
}
