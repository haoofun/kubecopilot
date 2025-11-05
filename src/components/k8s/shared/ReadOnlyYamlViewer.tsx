'use client'

import { dump } from 'js-yaml'

import { Card, CardContent } from '@/components/ui/card'

interface ReadOnlyYamlViewerProps {
  yaml?: string | null
  raw?: unknown
}

const keyValuePattern = /^(\s*)([^:#\n]+):(.*)$/
const listKeyPattern = /^(\s*-\s+)([^:#\n]+):(.*)$/

function renderHighlightedYaml(value: string) {
  return value.split('\n').map((line, index) => {
    const trimmed = line.trim()

    if (!line.length) {
      return (
        <span key={index} className="block break-words break-all">
          &nbsp;
        </span>
      )
    }

    if (trimmed.startsWith('#')) {
      return (
        <span
          key={index}
          className="block break-words break-all text-amber-300"
        >
          {line}
        </span>
      )
    }

    const listMatch = line.match(listKeyPattern)
    if (listMatch) {
      const [, bullet, key, rest] = listMatch
      return (
        <span key={index} className="block break-words break-all">
          <span>{bullet}</span>
          <span className="text-sky-300">{key.trim()}</span>
          <span className="text-slate-400">:</span>
          <span className="break-words break-all text-emerald-300">{rest}</span>
        </span>
      )
    }

    const kvMatch = line.match(keyValuePattern)
    if (kvMatch) {
      const [, indent, key, rest] = kvMatch
      return (
        <span key={index} className="block break-words break-all">
          <span>{indent}</span>
          <span className="text-sky-300">{key.trim()}</span>
          <span className="text-slate-400">:</span>
          <span className="break-words break-all text-emerald-300">{rest}</span>
        </span>
      )
    }

    return (
      <span key={index} className="block break-words break-all">
        {line}
      </span>
    )
  })
}

export function ReadOnlyYamlViewer({ yaml, raw }: ReadOnlyYamlViewerProps) {
  const value = yaml ?? (raw ? dump(raw) : '')
  const displayValue =
    value && value.trim().length > 0 ? value : '# YAML not available'

  return (
    <Card className="w-full max-w-full overflow-hidden shadow-sm">
      <CardContent className="max-h-[32rem] w-full max-w-full min-w-0 overflow-auto bg-slate-950 p-4">
        <pre className="w-full max-w-full overflow-x-auto font-mono text-xs break-words whitespace-pre-wrap text-slate-100">
          {renderHighlightedYaml(displayValue)}
        </pre>
      </CardContent>
    </Card>
  )
}
