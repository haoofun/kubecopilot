import { NextResponse, NextRequest } from 'next/server'
import { getK8sCoreV1Api } from '@/lib/k8s/client'
import yaml from 'js-yaml'
import { V1Service } from '@kubernetes/client-node'

type Params = Promise<{ namespace: string; name: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const sessionId = request.cookies.get('k8s-session-id')?.value
    const { namespace, name } = await params

    const k8sCoreApi = getK8sCoreV1Api(sessionId)

    // 获取 Service 详情
    const serviceDetail: V1Service = await k8sCoreApi.readNamespacedService({
      name: name,
      namespace: namespace,
    })

    const serviceUid = serviceDetail.metadata?.uid

    // 获取相关事件
    const serviceEventsRes = await k8sCoreApi.listNamespacedEvent({
      namespace,
      fieldSelector: `involvedObject.name=${name},involvedObject.uid=${serviceUid}`,
    })

    const serviceYaml = yaml.dump({
      ...serviceDetail,
      metadata: { ...serviceDetail.metadata, managedFields: undefined },
    })

    const responseData = {
      detail: serviceDetail,
      events: serviceEventsRes.items,
      yaml: serviceYaml,
    }

    return NextResponse.json(responseData)
  } catch (error: unknown) {
    console.error(`[SERVICE DETAIL API ERROR]`, error)
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      if (error.statusCode === 404) {
        return NextResponse.json(
          { message: `Service not found.`, error: String(error) },
          { status: 404 },
        )
      }
    }
    return NextResponse.json(
      { message: 'Failed to fetch service details.', error: String(error) },
      { status: 500 },
    )
  }
}
