'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button } from '@ui-kit/button'
import { Card } from '@ui-kit/card'
import { Skeleton } from '@ui-kit/skeleton'
import { cn } from '@/lib/utils'

export interface ResourceInspectorSection {
  id: string
  label: string
  content: React.ReactNode
}

interface ResourceInspectorProps {
  title: string
  sections: ResourceInspectorSection[]
  isLoading?: boolean
  hasSelection: boolean
  emptyMessage?: string
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function ResourceInspector({
  title,
  sections,
  isLoading,
  hasSelection,
  emptyMessage = 'Select a resource from the table to inspect its details.',
  collapsed,
  onCollapsedChange,
}: ResourceInspectorProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    if (sections.length && !activeSection) {
      setActiveSection(sections[0].id)
    }
  }, [sections, activeSection])

  const visibleSection = useMemo(() => {
    return sections.find((section) => section.id === activeSection)
  }, [sections, activeSection])

  const collapseEnabled = typeof onCollapsedChange === 'function'
  const isCollapsed = collapseEnabled ? Boolean(collapsed) : false

  const renderDesktopContent = () => {
    if (isCollapsed) {
      return (
        <Card className="flex h-full flex-col items-center justify-center gap-3 border shadow-sm">
          <p className="text-muted-foreground text-sm">Inspector collapsed</p>
          <Button
            type="button"
            size="sm"
            onClick={() => onCollapsedChange?.(false)}
          >
            Expand Inspector
          </Button>
        </Card>
      )
    }

    return (
      <Card className="flex h-full flex-col overflow-hidden border shadow-sm">
        <div className="border-b px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-muted-foreground text-xs font-semibold uppercase">
                Inspector
              </div>
              <h2 className="text-xl font-bold">{title}</h2>
            </div>
            {collapseEnabled ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onCollapsedChange?.(true)}
              >
                Collapse
              </Button>
            ) : null}
          </div>
          {sections.length > 1 ? (
            <nav className="mt-3 flex flex-wrap gap-2 text-sm font-medium">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'rounded-full px-3 py-1 transition-colors',
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          ) : null}
        </div>
        <div className="flex-1 overflow-auto px-5 py-4">
          {isLoading ? (
            <InspectorSkeleton />
          ) : hasSelection ? (
            sections.length <= 1 ? (
              sections[0]?.content
            ) : (
              visibleSection?.content
            )
          ) : (
            <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="hidden lg:block">{renderDesktopContent()}</div>

      <div className="lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setMobileOpen(true)}
          disabled={!hasSelection && !isLoading}
        >
          Open Inspector
        </Button>
        <div
          className={cn(
            'pointer-events-none fixed inset-0 z-40 bg-black/40 opacity-0 transition-opacity',
            mobileOpen && 'pointer-events-auto opacity-100',
          )}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className={cn(
              'bg-background absolute bottom-0 w-full translate-y-full rounded-t-2xl p-4 shadow-xl transition-transform',
              mobileOpen && 'translate-y-0',
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-lg font-semibold">{title}</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
              >
                Close
              </Button>
            </div>
            <div className="max-h-[75vh] space-y-3 overflow-auto px-1">
              {isLoading ? (
                <InspectorSkeleton />
              ) : hasSelection ? (
                sections.map((section) => (
                  <details key={section.id} className="rounded-lg border">
                    <summary className="cursor-pointer list-none px-4 py-2 text-sm font-semibold">
                      {section.label}
                    </summary>
                    <div className="text-muted-foreground px-4 pb-4 text-sm">
                      {section.content}
                    </div>
                  </details>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">{emptyMessage}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InspectorSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
