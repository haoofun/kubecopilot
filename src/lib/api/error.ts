// lib/api/error.ts

/**
 * 自定义 API 错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * K8s 特定错误
 */
export class K8sError extends ApiError {
  constructor(
    message: string,
    public k8sStatusCode?: number,
    public k8sReason?: string,
  ) {
    super(message, 500, 'K8S_ERROR')
    this.name = 'K8sError'
  }
}

/**
 * 验证错误
 */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message, 400, 'VALIDATION_ERROR', fields)
    this.name = 'ValidationError'
  }
}

/**
 * 资源未找到错误
 */
export class NotFoundError extends ApiError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} '${identifier}' not found`
      : `${resource} not found`
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

/**
 * 权限错误
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

/**
 * 未授权错误
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

type K8sStatusDetails = {
  kind?: string
  name?: string
}

type K8sStatusBody = {
  message?: string
  reason?: string
  details?: K8sStatusDetails
}

type MaybeK8sError = {
  response?: {
    body?: K8sStatusBody
    statusCode?: number
  }
  body?: K8sStatusBody
  statusCode?: number
  code?: string
  message?: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * 从 K8s 客户端错误转换为 ApiError
 */
export function parseK8sError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (isObject(error)) {
    const candidate = error as MaybeK8sError

    if (candidate.response?.body) {
      const body = candidate.response.body
      const statusCode = candidate.response.statusCode ?? 500
      const message = body.message ?? body.reason ?? 'K8s API error'
      const k8sReason = body.reason

      switch (statusCode) {
        case 404:
          return new NotFoundError(
            body.details?.kind || 'Resource',
            body.details?.name,
          )
        case 403:
          return new ForbiddenError(message)
        case 401:
          return new UnauthorizedError(message)
        case 409:
          return new ApiError(message, 409, 'CONFLICT')
        case 422:
          return new ValidationError(message)
        default:
          return new K8sError(message, statusCode, k8sReason)
      }
    }

    if (candidate.body) {
      return parseK8sError({
        response: {
          body: candidate.body,
          statusCode: candidate.statusCode,
        },
      })
    }

    const networkCode = candidate.code
    if (networkCode === 'ECONNREFUSED') {
      return new ApiError(
        'Cannot connect to Kubernetes API server',
        503,
        'CONNECTION_REFUSED',
      )
    }

    if (networkCode === 'ETIMEDOUT') {
      return new ApiError('Kubernetes API request timeout', 504, 'TIMEOUT')
    }

    if (typeof candidate.message === 'string') {
      return new ApiError(candidate.message)
    }
  }

  if (error instanceof Error) {
    return new ApiError(error.message)
  }

  return new ApiError('Internal server error', 500, 'INTERNAL_ERROR')
}

/**
 * 错误日志辅助函数
 */
export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString()
  const prefix = context ? `[${context}]` : ''

  const details: Record<string, unknown> = {}

  if (error instanceof ApiError) {
    details.name = error.name
    details.message = error.message
    details.statusCode = error.statusCode
    details.code = error.code
    details.details = error.details
    if (process.env.NODE_ENV === 'development') {
      details.stack = error.stack
    }
  } else if (error instanceof Error) {
    details.name = error.name
    details.message = error.message
    if (process.env.NODE_ENV === 'development') {
      details.stack = error.stack
    }
  } else {
    details.value = error
  }

  console.error(`${timestamp} ${prefix} Error:`, details)
}
