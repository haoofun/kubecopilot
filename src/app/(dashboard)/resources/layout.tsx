import type { ReactNode } from 'react'

import { ResourceBrowserLayout } from '@/components/resources/ResourceBrowserLayout'

export default function ResourcesLayout({ children }: { children: ReactNode }) {
  return <ResourceBrowserLayout>{children}</ResourceBrowserLayout>
}
