import { NextResponse, NextRequest } from 'next/server'
import { getK8sCoreV1Api } from '@/lib/k8s/client'
import yaml from 'js-yaml'
import { V1Pod } from '@kubernetes/client-node'

// 将 params 的类型定义为一个 Promise
type Params = Promise<{ namespace: string; name: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params }, // 更新参数类型
) {
  try {
    const sessionId = request.cookies.get('k8s-session-id')?.value
    const k8sApi = getK8sCoreV1Api(sessionId)

    // 关键修正: await params 来获取具体的参数值
    const { namespace, name } = await params

    const podDetail: V1Pod = await k8sApi.readNamespacedPod({
      name: name,
      namespace: namespace,
    })

    const podUid = podDetail.metadata?.uid

    const podEventsRes = await k8sApi.listNamespacedEvent({
      namespace: namespace,
      fieldSelector: `involvedObject.name=${name},involvedObject.uid=${podUid}`,
    })

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
    console.error(
      `[POD DETAIL API ERROR] ${error instanceof Error ? error.message : String(error)}}`,
    )
    // 因为 namespace 和 name 是从 await params 中解构出来的，在 catch 块中可能无法直接访问
    // 所以这里我们使用通用的错误信息
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      error.statusCode === 404
    ) {
      return NextResponse.json(
        { message: `Pod not found in namespace"`, error: String(error) },
        { status: 404 },
      )
    }
    return NextResponse.json(
      {
        message: 'Failed to fetch pod details.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
