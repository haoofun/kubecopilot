'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Box,
  Server,
  Layers3,
  Settings,
  ListChecks,
  AlarmClock,
  FileText,
  Lock,
  HardDrive,
  Database,
  CalendarDays,
  ServerCog,
  RouteIcon,
  Network,
  ServerCrash,
  ClipboardList,
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  const navSections = [
    {
      title: 'Operations',
      items: [
        {
          href: '/operation-plans',
          label: 'Operation Plans',
          icon: ClipboardList,
        },
      ],
    },
    {
      title: 'Observability',
      items: [
        { href: '/', label: 'Overview', icon: Home },
        { href: '/pods', label: 'Pods', icon: Box },
        { href: '/deployments', label: 'Deployments', icon: Server },
        { href: '/statefulsets', label: 'StatefulSets', icon: Layers3 },
        { href: '/daemonsets', label: 'DaemonSets', icon: Settings },
        { href: '/jobs', label: 'Jobs', icon: ListChecks },
        { href: '/cronjobs', label: 'CronJobs', icon: AlarmClock },
        { href: '/configmaps', label: 'ConfigMaps', icon: FileText },
        { href: '/secrets', label: 'Secrets', icon: Lock },
        { href: '/pvcs', label: 'PVCs', icon: HardDrive },
        { href: '/pvs', label: 'PVs', icon: Database },
        { href: '/ingresses', label: 'Ingresses', icon: RouteIcon },
        { href: '/events', label: 'Events', icon: CalendarDays },
        { href: '/nodes', label: 'Nodes', icon: ServerCog },
        { href: '/services', label: 'Services', icon: Network },
        { href: '/namespaces', label: 'Namespaces', icon: ServerCrash },
      ],
    },
  ]

  return (
    <div className="bg-muted/40 hidden border-r md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span>KubeCopilot</span>
          </Link>
        </div>
        <div className="flex-1">
          <div className="space-y-6 px-2 lg:px-4">
            {navSections.map((section) => (
              <nav
                key={section.title}
                className="space-y-2 text-sm font-medium"
              >
                <p className="text-muted-foreground px-3 text-xs font-semibold tracking-wide uppercase">
                  {section.title}
                </p>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
                      pathname === item.href && 'bg-muted text-primary',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
