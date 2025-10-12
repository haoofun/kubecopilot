'use client'

import Editor from '@monaco-editor/react'
import { Skeleton } from '@/components/ui/skeleton'

interface ReadOnlyYamlViewerProps {
  yamlString: string
}

export function ReadOnlyYamlViewer({ yamlString }: ReadOnlyYamlViewerProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Editor
        height="60vh"
        language="yaml"
        value={yamlString}
        theme="vs-dark" // 或者 "light"
        loading={<Skeleton className="h-[60vh] w-full" />}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  )
}
