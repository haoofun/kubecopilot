// lib/api/response.ts
import { NextResponse } from 'next/server'
import { ApiError, parseK8sError, logError } from './error'

/**
 * 成功响应的统一格式
 */
export interface SuccessResponse<T = unknown> {
  success: true
  data: T
  metadata?: Record<string, unknown> & {
    timestamp: string
  }
}

/**
 * 错误响应的统一格式
 */
export interface ErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    statusCode: number
    details?: unknown
  }
  metadata?: {
    timestamp: string
    requestId?: string
  }
}

/**
 * 创建成功响应
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
 * 创建错误响应
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
 * 简化版成功响应（直接返回数据，不包装）
 */
export function createDataResponse<T>(data: T): NextResponse<T> {
  return NextResponse.json(data)
}

/**
 * 创建分页响应
 */
export interface PaginatedResponse<T> {
  items: T[]
  metadata: {
    total: number
    page?: number
    pageSize?: number
    continue?: string
    hasMore?: boolean
  }
}

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

/**
 * 创建 No Content 响应（204）
 */
export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

/**
 * 创建 Created 响应（201）
 */
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
