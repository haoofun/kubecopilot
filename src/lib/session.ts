import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

/**
 * Implements a truly singleton in-memory session store that persists across
 * Next.js hot reloads in development.
 */
declare global {
  var __sessionStore: Map<string, string> | undefined
}

/**
 * In-memory store that holds kubeconfigs per session so all server-side API routes can authenticate to Kubernetes
 * on behalf of the signed-in observability user.
 */
const sessionStore: Map<string, string> =
  globalThis.__sessionStore ?? new Map<string, string>()

if (!globalThis.__sessionStore) {
  globalThis.__sessionStore = sessionStore
}

/** Cookie used to tie browser requests back to the in-memory kubeconfig session. */
export const SESSION_COOKIE_NAME = 'kubecopilot.session'

export interface SessionData {
  id: string
  kubeconfig: string
}

/**
 * 创建一个新的会话。
 * 1. 生成一个安全的、随机的会话 ID。
 * 2. 将 kubeconfig 字符串存入内存中的 sessionStore。
 * 3. 在客户端浏览器中设置一个包含会话 ID 的 httpOnly cookie。
 * @param kubeconfigString - 要存储的 kubeconfig 内容。
 */
export async function createSession(kubeconfigString: string): Promise<string> {
  const sessionId = randomBytes(32).toString('hex')

  sessionStore.set(sessionId, kubeconfigString)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true, // 关键安全设置：防止客户端 JS 读取 cookie
    secure: process.env.NODE_ENV === 'production', // 仅在 HTTPS 中发送
    maxAge: 60 * 60 * 24, // 24 小时有效期
    path: '/',
    sameSite: 'lax', // 防止 CSRF 攻击
  })

  return sessionId
}

/**
 * (核心函数) 获取当前用户的会话数据。
 * 这是我们架构的关键：它从请求的 cookie 中自动提取会话 ID，
 * 然后用它来从 sessionStore 中检索数据。
 * 所有后端逻辑（如 client.ts）都应调用此函数，而不是直接处理 cookie。
 * @returns 当前用户的会话数据，如果不存在则返回 null。
 */
export async function getSession(): Promise<SessionData | null> {
  // cookies() 函数会自动从当前请求中读取 cookie
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
  const sessionId = sessionCookie?.value

  if (!sessionId) {
    return null
  }

  if (typeof sessionId === 'string') {
    const kubeconfig = sessionStore.get(sessionId)

    if (!kubeconfig) {
      // Cookie 存在但 session store 中没有对应数据（可能服务重启或 session 过期）
      // 最好是清理掉无效的 cookie
      await clearSession()
      return null
    }

    return { id: sessionId, kubeconfig }
  }

  return null
}

/**
 * 清除当前用户的会话。
 * 1. 从 sessionStore 中删除数据。
 * 2. 删除客户端浏览器中的 cookie。
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
  const sessionId = sessionCookie?.value

  if (sessionId) {
    sessionStore.delete(sessionId)
  }
  cookieStore.delete(SESSION_COOKIE_NAME)
}
