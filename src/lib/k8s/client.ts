import { KubeConfig, CoreV1Api, AppsV1Api } from '@kubernetes/client-node'
import { sessionStore } from '@/lib/session'

/**
 * 核心函数：根据会话 ID 加载并返回 KubeConfig 对象实例。
 * 这个 KubeConfig 对象已经包含了所有认证信息，可以用来创建任何类型的 API 客户端。
 * @param sessionId - The user's session ID from the cookie.
 * @returns A fully configured KubeConfig object.
 */
export function loadKubeConfig(
  sessionId: string | undefined | null,
): KubeConfig {
  if (!sessionId) {
    throw new Error('Session ID is missing from cookie. Unauthorized.')
  }

  const kubeconfigString = sessionStore.get(sessionId)

  if (!kubeconfigString) {
    throw new Error(
      `Invalid session ID (${sessionId}) or session has expired. Session store has ${sessionStore.size} items. Unauthorized.`,
    )
  }

  const kc = new KubeConfig()
  kc.loadFromString(kubeconfigString)
  return kc
}

/**
 * 【旧函数，保留以便向后兼容或用于简单场景】
 * 使用 KubeConfig 创建一个 CoreV1Api 客户端。
 * @param sessionId - The user's session ID.
 * @returns An instance of CoreV1Api.
 */
export function getK8sCoreV1Api(
  sessionId: string | undefined | null,
): CoreV1Api {
  const kc = loadKubeConfig(sessionId)
  return kc.makeApiClient(CoreV1Api)
}

/**
 * 【新函数】
 * 使用 KubeConfig 创建一个 AppsV1Api 客户端。
 * @param sessionId - The user's session ID.
 * @returns An instance of AppsV1Api.
 */
export function getK8sAppsV1Api(
  sessionId: string | undefined | null,
): AppsV1Api {
  const kc = loadKubeConfig(sessionId)
  return kc.makeApiClient(AppsV1Api)
}

// 未来我们可以继续在这里扩展，例如：
// export function getK8sBatchV1Api(...) { ... }
