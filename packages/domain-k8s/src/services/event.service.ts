import { getCoreV1Api } from '../client'
import { transformEventToK8sEvent } from '../transformers/event'
import { buildListCallParams } from '../utils/params'
import type { ListResponse, QueryParams } from '../types/common'
import type { K8sEvent } from '../types/event'

/**
 * 命名空间事件列表选项，让可观测性看板可以限定在某个租户并透传 K8s 查询参数。
 */
export interface ListEventsOptions {
  /** namespace 指定 Kubernetes 命名空间，映射 listNamespacedEvent 的路径。 */
  namespace: string
  /** params 允许 UI 传递 label/field selector 与分页信息，保持与 Kubernetes watch 语义一致。 */
  params?: QueryParams
}

/**
 * 获取命名空间级别的事件列表并转换成 K8sEvent，用于资源详情的事件表格。
 */
export async function listEvents({
  namespace,
  params,
}: ListEventsOptions): Promise<ListResponse<K8sEvent>> {
  const coreV1Api = await getCoreV1Api()
  const requestBase = buildListCallParams(params)

  const response = await coreV1Api.listNamespacedEvent({
    namespace,
    ...requestBase,
  })

  const items = response.items?.map(transformEventToK8sEvent) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

/** 集群级事件查询选项，提供给看板的全局事件页。 */
export interface ListClusterEventsOptions {
  /** params 承载原生 QueryParams，以便 watch、分页等参数直接传入 listEventForAllNamespaces。 */
  params?: QueryParams
}

/** 获取整个集群的事件列表供可观测性看板的全局事件流使用。 */
export async function listClusterEvents({
  params,
}: ListClusterEventsOptions = {}): Promise<ListResponse<K8sEvent>> {
  const coreV1Api = await getCoreV1Api()
  const requestBase = buildListCallParams(params)

  const response = await coreV1Api.listEventForAllNamespaces({
    ...requestBase,
  })

  const items = response.items?.map(transformEventToK8sEvent) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

/**
 * 根据资源 UID/名称/类型筛选事件，用于看板在资源详情内只展示相关事件。
 */
export interface ListEventsForResourceOptions {
  /** namespace 指定事件查询范围，匹配 Kubernetes namespaced event API。 */
  namespace?: string
  /** params 透传额外 QueryParams（分页、超时等）。 */
  params?: QueryParams
  /** uid 添加 fieldSelector `involvedObject.uid`，帮助定位特定对象事件。 */
  uid?: string
  /** name 添加 fieldSelector `involvedObject.name`，配合 UI 的资源名称过滤。 */
  name?: string
  /** kind 添加 fieldSelector `involvedObject.kind`，让看板同类型资源聚合事件。 */
  kind?: string
}

/**
 * 根据资源元信息拉取相关事件，若指定 namespace 则调用 namespaced API，否则回退到集群级。
 */
export async function listEventsForResource({
  namespace,
  uid,
  name,
  kind,
  params,
}: ListEventsForResourceOptions): Promise<ListResponse<K8sEvent>> {
  const fieldSelectors: string[] = []

  if (uid) {
    fieldSelectors.push(`involvedObject.uid=${uid}`)
  }

  if (name) {
    fieldSelectors.push(`involvedObject.name=${name}`)
  }

  if (kind) {
    fieldSelectors.push(`involvedObject.kind=${kind}`)
  }

  const mergedParams: QueryParams = {
    ...params,
  }

  if (fieldSelectors.length > 0) {
    mergedParams.fieldSelector = fieldSelectors.join(',')
  }

  if (namespace) {
    return listEvents({ namespace, params: mergedParams })
  }

  return listClusterEvents({ params: mergedParams })
}
