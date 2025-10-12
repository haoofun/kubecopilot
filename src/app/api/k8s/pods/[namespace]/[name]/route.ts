import { NextResponse, NextRequest } from 'next/server'
import { getK8sCoreV1Api } from '@/lib/k8s/client'
import yaml from 'js-yaml'
import { V1Pod } from '@kubernetes/client-node'

type Params = Promise<{ namespace: string; name: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const sessionId = request.cookies.get('k8s-session-id')?.value
    const { namespace, name } = await params

    // 标准化模式: 明确声明并创建我们需要的所有客户端
    // 在这里，Pod 详情和 Event 都需要 CoreV1Api
    const k8sCoreApi = getK8sCoreV1Api(sessionId)

    // 步骤 1: 使用 CoreV1Api 获取 Pod 详情
    const podDetail: V1Pod = await k8sCoreApi.readNamespacedPod({
      name: name,
      namespace: namespace,
    })

    const podUid = podDetail.metadata?.uid

    // 步骤 2: 再次使用 CoreV1Api 获取事件
    const podEventsRes = await k8sCoreApi.listNamespacedEvent({
      namespace,
      fieldSelector: `involvedObject.name=${name},involvedObject.uid=${podUid}`,
    })

    // ... 后续代码保持不变 ...
    const podYaml = yaml.dump({
      ...podDetail,
      metadata: { ...podDetail.metadata, managedFields: undefined },
    })
    const responseData = {
      detail: podDetail,
      events: podEventsRes.items,
      yaml: podYaml,
    }
    return NextResponse.json(responseData)
  } catch (error: unknown) {
    // 使用 unknown 以确保类型安全
    // ... 错误处理代码保持不变 ...
    console.error(`[POD DETAIL API ERROR]`, error)
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      if (error.statusCode === 404) {
        return NextResponse.json(
          { message: `Pod not found.`, error: String(error) },
          { status: 404 },
        )
      }
    }
    return NextResponse.json(
      { message: 'Failed to fetch pod details.', error: String(error) },
      { status: 500 },
    )
  }
}
