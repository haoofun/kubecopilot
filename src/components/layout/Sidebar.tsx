'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils' // shadcn/ui's utility for conditional classes
import { Home, Box, Server, Network } from 'lucide-react' // Icons

export function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Overview', icon: Home },
    { href: '/pods', label: 'Pods', icon: Box },
    { href: '/deployments', label: 'Deployments', icon: Server },
    { href: '/services', label: 'Services', icon: Network },
    { href: '/namespaces', label: 'Namespaces', icon: Box },
  ]

  return (
    <div className="bg-muted/40 hidden border-r md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            {/* You can add an SVG logo here later */}
            <span className="">KubeCopilot</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
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
        </div>
      </div>
    </div>
  )
}
