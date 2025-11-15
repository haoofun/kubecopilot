import type { ReactNode } from 'react'

interface ResourceBrowserLayoutProps {
  children: ReactNode
}

export function ResourceBrowserLayout({
  children,
}: ResourceBrowserLayoutProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-xs font-semibold uppercase">
          Raw Kubernetes Explorer
        </p>
        <div>
          <h1 className="text-2xl font-bold">Resources</h1>
          <p className="text-muted-foreground text-sm">
            Inspect metadata, specs, status, events, and YAML per resource
            without leaving the Mission Control shell.
          </p>
        </div>
      </header>
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  )
}
