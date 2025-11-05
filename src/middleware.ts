import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { SESSION_COOKIE_NAME } from '@/lib/session'

// 这个函数将会在匹配的路径上，于页面渲染前执行
export function middleware(request: NextRequest) {
  // 1. 从请求中获取会话 Cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
  const { pathname } = request.nextUrl

  // 2. 认证保护逻辑
  // 如果用户尝试访问除 /connect 之外的任何受保护页面，但没有会话 Cookie
  if (pathname !== '/connect' && !sessionCookie) {
    // 将他们重定向到连接页面
    return NextResponse.redirect(new URL('/connect', request.url))
  }

  // 3. 防止已连接用户再次访问连接页面
  // 如果用户已经有会话 Cookie，但又访问了 /connect 页面
  if (pathname === '/connect' && sessionCookie) {
    // 将他们重定向到仪表盘主页
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 如果以上条件都不满足，则允许请求继续
  return NextResponse.next()
}

// 4. 配置 Middleware 的作用范围
// 使用 matcher 来指定哪些路径需要经过这个 middleware 处理
export const config = {
  matcher: [
    /*
     * 匹配除了以下路径之外的所有请求路径:
     * - api (API 路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
