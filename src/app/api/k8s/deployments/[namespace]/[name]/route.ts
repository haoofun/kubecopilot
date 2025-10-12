import { NextResponse, NextRequest } from 'next/server'
import { getK8sAppsV1Api, getK8sCoreV1Api } from '@/lib/k8s/client'
import yaml from 'js-yaml'
import { V1Deployment } from '@kubernetes/client-node'

type Params = Promise<{ namespace: string; name: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const sessionId = request.cookies.get('k8s-session-id')?.value
    const k8sAppsApi = getK8sAppsV1Api(sessionId)
    const k8sCoreApi = getK8sCoreV1Api(sessionId) // 我们需要它来获取事件

    const { namespace, name } = await params

    const deploymentDetailRes: V1Deployment =
      await k8sAppsApi.readNamespacedDeployment({
        name: name,
        namespace: namespace,
      })

    // 从 Deployment 详情中安全地获取 uid
    const deploymentUid = deploymentDetailRes.metadata?.uid

    const deploymentEventsRes = await k8sCoreApi.listNamespacedEvent({
      namespace,
      fieldSelector: `involvedObject.name=${name},involvedObject.uid=${deploymentUid}`,
    })

    const deploymentYaml = yaml.dump({
      ...deploymentDetailRes,
      metadata: { ...deploymentDetailRes.metadata, managedFields: undefined },
    })

    const responseData = {
      detail: deploymentDetailRes,
      events: deploymentEventsRes.items,
      yaml: deploymentYaml,
    }

    return NextResponse.json(responseData)
  } catch (error: unknown) {
    console.error(`[DEPLOYMENT DETAIL API ERROR]`, error)
    // 使用类型守卫来安全地处理错误
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      if (error.statusCode === 404) {
        return NextResponse.json(
          { message: `Deployment not found.`, error: String(error) },
          { status: 404 },
        )
      }
    }
    return NextResponse.json(
      { message: 'Failed to fetch deployment details.', error: String(error) },
      { status: 500 },
    )
  }
}
