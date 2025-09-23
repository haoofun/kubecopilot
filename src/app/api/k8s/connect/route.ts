import { NextResponse } from 'next/server'
import { KubeConfig, CoreV1Api } from '@kubernetes/client-node'

// 这是一个极其简化的、用于 MVP 阶段的内存会话存储。
// 在生产环境中，这应该被替换为 Redis 或其他持久化存储。
// 键是会话 ID，值是 Kubeconfig 字符串。
const sessionStore = new Map<string, string>()

function generateSessionId() {
  // 生成一个足够随机的安全会话 ID
  return crypto.randomUUID()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const kubeconfigString = body.kubeconfig

    if (!kubeconfigString) {
      return NextResponse.json(
        { message: 'Kubeconfig content is required.' },
        { status: 400 },
      )
    }

    // 1. 使用 @kubernetes/client-node 尝试加载 Kubeconfig
    const kc = new KubeConfig()
    kc.loadFromString(kubeconfigString)

    // 2. 创建一个 API 客户端实例
    const k8sApi = kc.makeApiClient(CoreV1Api)

    // 3. 执行一个简单的只读 API 调用来验证连接性和凭证有效性
    //    listNamespaces 是一个很好的选择，因为它权限要求低且开销小。
    await k8sApi.listNamespace()

    // 4. 如果上面的调用没有抛出异常，说明 Kubeconfig 是有效的。
    //    现在，我们创建一个会话。
    const sessionId = generateSessionId()
    sessionStore.set(sessionId, kubeconfigString)

    // 5. 将会话 ID 放入一个安全的、HttpOnly 的 Cookie 中返回给客户端
    const response = NextResponse.json({ message: 'Connection successful.' })
    response.cookies.set('k8s-session-id', sessionId, {
      httpOnly: true, // 防止客户端 JS 访问
      secure: process.env.NODE_ENV === 'production', // 在生产中只通过 HTTPS 发送
      sameSite: 'strict', // 严格的同站策略，增强 CSRF 保护
      path: '/',
    })

    console.log(`Successfully created session: ${sessionId}`)
    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Failed to connect to Kubernetes cluster:', errorMessage)

    // 返回一个对用户友好的错误信息
    return NextResponse.json(
      {
        message: 'Failed to connect. Please check your Kubeconfig and network.',
        error: errorMessage,
      },
      { status: 400 },
    )
  }
}
