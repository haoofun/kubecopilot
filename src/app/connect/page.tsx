'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation' // 导入 useRouter
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert' // 导入 Alert

// 建议也安装一下 lucide-react 用于图标
import { Terminal } from 'lucide-react'

export default function ConnectPage() {
  const [kubeconfig, setKubeconfig] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null) // 新增：用于存储错误信息
  const router = useRouter() // 初始化 router

  const handleConnect = async () => {
    setIsLoading(true)
    setError(null) // 重置错误状态

    try {
      const response = await fetch('/api/k8s/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kubeconfig }),
      })

      if (!response.ok) {
        // 如果响应状态码不是 2xx，则解析错误信息
        const errorData = await response.json()
        throw new Error(errorData.message || 'An unknown error occurred.')
      }

      // 如果连接成功，跳转到 dashboard
      router.push('/') // 或 '/dashboard'
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(String(err))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Connect to Kubernetes Cluster</CardTitle>
          <CardDescription>
            Paste the contents of your kubeconfig file below. Your credentials
            are sent directly to the server and never stored in the browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="kubeconfig">Kubeconfig</Label>
            <Textarea
              id="kubeconfig"
              placeholder="apiVersion: v1
clusters:
- cluster:
    ..."
              className="min-h-[300px] font-mono"
              value={kubeconfig}
              onChange={(e) => setKubeconfig(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleConnect}
            disabled={isLoading || !kubeconfig.trim()}
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
