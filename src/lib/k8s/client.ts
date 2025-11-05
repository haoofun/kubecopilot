import {
  KubeConfig,
  CoreV1Api,
  AppsV1Api,
  BatchV1Api,
  NetworkingV1Api,
} from '@kubernetes/client-node'
import { UnauthorizedError } from '@/lib/api/error'
import { getSession } from '@/lib/session' // 假设我们有一个获取会话的模块

// 全局缓存 KubeConfig 实例，避免重复加载
const kcCache = new Map<string, KubeConfig>()

async function getKubeConfig(): Promise<KubeConfig> {
  const session = await getSession()
  if (!session || !session.kubeconfig) {
    throw new UnauthorizedError(
      'Kubeconfig not found in session. User is not connected.',
    )
  }
  const sessionId = session.id // 假设会话有唯一 ID

  if (kcCache.has(sessionId)) {
    return kcCache.get(sessionId)!
  }

  const kc = new KubeConfig()
  // Kubeconfig 来自于 session 中存储的 YAML 字符串
  kc.loadFromString(session.kubeconfig)

  // 根据会话 ID 缓存实例
  kcCache.set(sessionId, kc)

  return kc
}

// 导出一个工厂函数来获取 CoreV1Api 客户端
export async function getCoreV1Api(): Promise<CoreV1Api> {
  const kc = await getKubeConfig()
  return kc.makeApiClient(CoreV1Api)
}

// 导出一个工厂函数来获取 AppsV1Api 客户端 (用于 Deployments 等)
export async function getAppsV1Api(): Promise<AppsV1Api> {
  const kc = await getKubeConfig()
  return kc.makeApiClient(AppsV1Api)
}

export async function getBatchV1Api(): Promise<BatchV1Api> {
  const kc = await getKubeConfig()
  return kc.makeApiClient(BatchV1Api)
}

export async function getNetworkingV1Api(): Promise<NetworkingV1Api> {
  const kc = await getKubeConfig()
  return kc.makeApiClient(NetworkingV1Api)
}

// ... 未来可以为其他 API Group (NetworkingV1Api, etc.) 添加更多工厂函数
