import useSWR, { SWRConfiguration } from 'swr'
import {
  DetailResponse,
  ListResponse,
  QueryParams,
} from '../lib/k8s/types/common'

interface HttpError extends Error {
  status?: number
  url?: string
  requestId?: string
}

// 增强的 fetcher，支持 AbortSignal
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(30000), // 30秒超时
  })

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== 'undefined') {
        window.location.href = '/connect'
      }
    }
    let errMsg = `HTTP ${res.status}: ${res.statusText}`
    let requestId: string | undefined
    try {
      const errData = await res.json()
      const apiError = errData?.error
      requestId = errData?.metadata?.requestId || apiError?.requestId
      errMsg = apiError?.message ?? errData?.message ?? errMsg
    } catch {
      // 如果响应不是 JSON，使用 status text
    }

    const finalMessage = requestId ? `${errMsg} (request ${requestId})` : errMsg
    const error: HttpError = new Error(finalMessage)
    // 附加额外信息便于调试
    error.status = res.status
    error.url = url
    error.requestId = requestId
    throw error
  }

  return res.json()
}

interface UseK8sResourceOptions {
  /**
   * 资源类型，如: pods, services, deployments
   */
  resourceBase: string

  /**
   * 资源名称（获取单个资源时必需）
   */
  name?: string

  /**
   * 命名空间
   * - 不传：cluster-scoped 资源或所有 namespace
   * - 传值：指定 namespace 下的资源
   */
  namespace?: string

  /**
   * URL 查询参数
   * 例如: { labelSelector: 'app=nginx', limit: 10 }
   */
  params?: QueryParams

  /**
   * 是否启用请求（默认 true）
   */
  enabled?: boolean

  /**
   * SWR 配置
   */
  swrConfig?: SWRConfiguration
}

// 默认 SWR 配置
const defaultSwrConfig: SWRConfiguration = {
  revalidateOnFocus: false, // 窗口聚焦时不自动刷新
  revalidateOnReconnect: true, // 重新连接时刷新
  dedupingInterval: 2000, // 2秒内的重复请求会被去重
  errorRetryCount: 3, // 错误重试3次
  errorRetryInterval: 5000, // 重试间隔5秒
}

/**
 * 通用 K8s 资源 Hook
 *
 * @example
 * // 获取所有 pods
 * useK8sResource({ resourceBase: 'pods' })
 *
 * // 获取指定 namespace 下的 pods
 * useK8sResource({ resourceBase: 'pods', namespace: 'default' })
 *
 * // 获取单个 pod
 * useK8sResource({ resourceBase: 'pods', namespace: 'default', name: 'nginx' })
 *
 * // 带查询参数
 * useK8sResource({
 *   resourceBase: 'pods',
 *   params: { labelSelector: 'app=nginx' }
 * })
 */
export function useK8sResource<T>({
  resourceBase,
  name,
  namespace,
  params,
  enabled = true,
  swrConfig = {},
}: UseK8sResourceOptions) {
  // 构建 URL 路径
  const buildUrl = () => {
    let path = `/api/k8s/${resourceBase}`

    // 处理不同的路径模式
    if (name) {
      // 单个资源: /api/k8s/pods/default/nginx
      path = namespace
        ? `/api/k8s/${resourceBase}/${namespace}/${name}`
        : `/api/k8s/${resourceBase}/${name}`
    } else if (namespace) {
      // 指定 namespace 的列表: /api/k8s/pods/default
      path = `/api/k8s/${resourceBase}/${namespace}`
    }
    // 否则是所有 namespace 的列表: /api/k8s/pods

    // 添加查询参数
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        path += `?${queryString}`
      }
    }

    return path
  }

  const url = buildUrl()
  const key = enabled ? url : null

  // 合并配置
  const finalConfig = {
    ...defaultSwrConfig,
    ...swrConfig,
  }

  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    key,
    fetcher,
    finalConfig,
  )

  return {
    data,
    isLoading,
    isValidating, // 是否正在重新验证（后台刷新）
    isError: !!error,
    error: error as Error | undefined,
    mutate,
    // 便捷的刷新方法
    refresh: () => mutate(),
  }
}

// 类型安全的变体 - 用于列表查询
export function useK8sResourceList<T>(
  options: Omit<UseK8sResourceOptions, 'name'>,
) {
  return useK8sResource<ListResponse<T>>(options)
}

// 类型安全的变体 - 用于单个资源查询
export function useK8sResourceDetail<TSummary, TRaw = unknown>(
  options: Omit<UseK8sResourceOptions, 'name'> &
    Required<Pick<UseK8sResourceOptions, 'resourceBase'>> & { name: string },
) {
  return useK8sResource<DetailResponse<TSummary, TRaw>>(options)
}
