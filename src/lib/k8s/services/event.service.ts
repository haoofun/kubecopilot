import { getCoreV1Api } from '../client'
import { transformEventToK8sEvent } from '../transformers/event'
import { buildListCallParams } from '../utils/params'
import type { ListResponse, QueryParams } from '../types/common'
import type { K8sEvent } from '../types/event'

export interface ListEventsOptions {
  namespace: string
  params?: QueryParams
}

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

export interface ListClusterEventsOptions {
  params?: QueryParams
}

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

export interface ListEventsForResourceOptions {
  namespace?: string
  params?: QueryParams
  uid?: string
  name?: string
  kind?: string
}

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
