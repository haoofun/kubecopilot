// lib/api/response.ts
import { NextResponse } from 'next/server'
import { ApiError, parseK8sError, logError } from './error'

/**
 * 成功响应的统一格式，确保可观测性看板在消费 Kubernetes 数据时拿到标准包装。
 */
export interface SuccessResponse<T = unknown> {
  /** success 恒为 true，UI 可以快速判断请求状态。 */
  success: true
  /** data 承载具体的 Kubernetes 或衍生数据。 */
  data: T
  /** metadata 包括时间戳等信息，方便在看板标注刷新时间。 */
  metadata?: Record<string, unknown> & {
    timestamp: string
  }
}

/**
 * 错误响应的统一格式，便于看板根据 code/statusCode 映射不同的 Kubernetes 错误提示。
 */
export interface ErrorResponse {
  /** success 恒为 false，UI 可直接展示错误态。 */
  success: false
  error: {
    /** message 向用户显示的错误描述，可能来自 Kubernetes API。 */
    message: string
    /** code 表示内部错误码（如 K8S_ERROR/VALIDATION_ERROR）。 */
    code?: string
    /** statusCode 是 HTTP 状态，常与 Kubernetes API 状态码一致。 */
    statusCode: number
    /** details 附带额外上下文，例如 K8s Status 对象。 */
    details?: unknown
  }
  metadata?: {
    /** timestamp 帮助日志/审计追踪错误发生时间。 */
    timestamp: string
    /** requestId 用于跨服务追踪请求。 */
    requestId?: string
  }
}

/**
 * 创建成功响应，将 Kubernetes 或 AI 结果包装成统一结构供看板消费。
 */
export function createSuccessResponse<T>(
  data: T,
  metadata?: Record<string, unknown>,
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  })
}

/**
 * 创建错误响应，将任意错误（包括 Kubernetes SDK 抛出的）转换为统一的 ErrorResponse。
 */
export function createErrorResponse(
  error: unknown,
  context?: string,
): NextResponse<ErrorResponse> {
  // 解析错误
  const apiError = error instanceof ApiError ? error : parseK8sError(error)

  // 记录日志
  logError(apiError, context)

  // 构建响应
  const response: ErrorResponse = {
    success: false,
    error: {
      message: apiError.message,
      code: apiError.code,
      statusCode: apiError.statusCode,
      details: apiError.details,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response, {
    status: apiError.statusCode,
  })
}

/**
 * 简化版成功响应（直接返回数据，不包装），用于 Next.js API route 兼容性场景。
 */
export function createDataResponse<T>(data: T): NextResponse<T> {
  return NextResponse.json(data)
}

/**
 * 创建分页响应
 */
export interface PaginatedResponse<T> {
  /** items 为列表数据，常对应 Kubernetes 列表项。 */
  items: T[]
  metadata: {
    /** total 记录总数，obBoard 用于分页统计，若来自 Kubernetes remain count 则传入。 */
    total: number
    /** page/pageSize 描述前端分页状态。 */
    page?: number
    pageSize?: number
    /** continue 对应 Kubernetes `_continue` token。 */
    continue?: string
    /** hasMore 告诉前端是否还有下一页 (基于 continue token)。 */
    hasMore?: boolean
  }
}

/** 封装分页响应，自动计算 continue token 与 hasMore，适配 Kubernetes list API。 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page?: number,
  pageSize?: number,
  continueToken?: string,
): NextResponse<SuccessResponse<PaginatedResponse<T>>> {
  return createSuccessResponse({
    items,
    metadata: {
      total,
      page,
      pageSize,
      continue: continueToken,
      hasMore: !!continueToken,
    },
  })
}

/** 创建 No Content 响应（204），用于删除等无主体操作。 */
export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

/** 创建 Created 响应（201），可选地返回 Location 头指向新建的 Kubernetes 资源 URL。 */
export function createCreatedResponse<T>(
  data: T,
  location?: string,
): NextResponse<SuccessResponse<T>> {
  const headers: Record<string, string> = {}
  if (location) {
    headers['Location'] = location
  }

  return NextResponse.json(
    {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
    {
      status: 201,
      headers,
    },
  )
}
