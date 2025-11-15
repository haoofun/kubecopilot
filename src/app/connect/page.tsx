'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation' // 导入 useRouter
import { Button } from '@ui-kit/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@ui-kit/card'
import { Label } from '@ui-kit/label'
import { Textarea } from '@ui-kit/textarea'
import { Alert, AlertDescription, AlertTitle } from '@ui-kit/alert' // 导入 Alert

// 建议也安装一下 lucide-react 用于图标
import { Terminal } from 'lucide-react'

export default function ConnectPage() {
  const [kubeconfig, setKubeconfig] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null) // 新增：用于存储错误信息
  const router = useRouter() // 初始化 router
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleConnect = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/k8s/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kubeconfig }),
      })

      const data = await response.json()

      if (!response.ok || data?.success === false) {
        const errorMessage =
          data?.error?.message || data?.message || 'An unknown error occurred.'
        throw new Error(errorMessage)
      }

      router.push('/')
    } catch (err: unknown) {
      console.error('Frontend Connect Error:', err) // 在浏览器控制台打印详细错误
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setKubeconfig(text)
      setError(null)
    } catch (fileError) {
      console.error('Failed to read kubeconfig file', fileError)
      setError('Unable to read the selected file. Please try again.')
    } finally {
      // reset input so selecting the same file again still triggers change
      event.target.value = ''
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
          <CardDescription className="text-muted-foreground text-xs">
            提示：在本地运行{' '}
            <code className="font-mono">kubectl config view --raw</code>{' '}
            即可复制完整 kubeconfig；或在云控制台下载 kubeconfig
            文件后使用下方“上传文件”按钮自动填充。
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
            <div className="flex items-center justify-between">
              <Label htmlFor="kubeconfig">Kubeconfig</Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".yaml,.yml,.json,text/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleFileUpload}
                  disabled={isLoading}
                >
                  上传文件
                </Button>
              </div>
            </div>
            <Textarea
              id="kubeconfig"
              placeholder={`apiVersion: v1
clusters:
- cluster:
    ...`}
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
