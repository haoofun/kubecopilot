'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'

import { Button } from '@ui-kit/button'
import { cn } from '@/lib/utils'

export type ResourceRelation = {
  id: string
  label: string
  kind: string
  href?: string
  namespace?: string
  description?: string
  disabled?: boolean
  copyValue?: string
}

interface ResourceRelationsProps {
  title?: string
  relations: ResourceRelation[]
  emptyMessage?: string
}

export function ResourceRelations({
  title = 'Related Resources',
  relations,
  emptyMessage = 'No related resources',
}: ResourceRelationsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = useCallback(async (relation: ResourceRelation) => {
    if (!relation.copyValue) return
    try {
      await navigator.clipboard.writeText(relation.copyValue)
      setCopiedId(relation.id)
      setTimeout(
        () =>
          setCopiedId((current) => (current === relation.id ? null : current)),
        2000,
      )
    } catch {
      // ignore failures; browser will handle permission prompts
    }
  }, [])

  return (
    <div className="space-y-3">
      <div>
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {title}
        </p>
        {relations.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        ) : null}
      </div>
      {relations.length ? (
        <div className="flex flex-wrap gap-2">
          {relations.map((relation) => {
            const content = (
              <div className="flex flex-col text-left">
                <span className="text-muted-foreground text-xs font-semibold uppercase">
                  {relation.kind}
                  {relation.namespace ? ` · ${relation.namespace}` : ''}
                </span>
                <span className="font-medium">{relation.label}</span>
              </div>
            )

            if (relation.href && !relation.disabled) {
              return (
                <Link
                  key={relation.id}
                  href={relation.href}
                  prefetch={false}
                  className={cn(
                    'hover:bg-muted rounded-full border px-4 py-2 text-sm shadow-sm transition-colors',
                    'bg-background',
                  )}
                >
                  {content}
                </Link>
              )
            }

            const copyAllowed = Boolean(relation.copyValue)

            return (
              <Button
                key={relation.id}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'rounded-full border px-4 py-2 text-left shadow-sm',
                  relation.disabled &&
                    !copyAllowed &&
                    'pointer-events-none opacity-60',
                )}
                onClick={() => handleCopy(relation)}
                disabled={!copyAllowed}
              >
                {content}
                {copyAllowed ? (
                  <span className="text-muted-foreground text-[11px]">
                    {copiedId === relation.id ? 'Copied' : 'Copy'}
                  </span>
                ) : null}
              </Button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
