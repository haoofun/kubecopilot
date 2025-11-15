'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { navConfig } from '@/config/navConfig'
import { type NavItem } from '@/config/navigation'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const navSections = navConfig

  const isItemActive = useCallback(
    (item: NavItem): boolean => {
      if (item.href && pathname === item.href) {
        return true
      }

      return item.children?.some((child) => isItemActive(child)) ?? false
    },
    [pathname],
  )

  const findActiveBranch = useCallback(() => {
    let found: string | null = null

    const traverse = (items: NavItem[], parentKey: string) => {
      items.forEach((item) => {
        if (found || !item.children?.length) return
        const key = `${parentKey}-${item.label}`
        const childIsActive = item.children.some((child) => isItemActive(child))
        if (childIsActive) {
          found = key
          return
        }
        traverse(item.children, key)
      })
    }

    navSections.forEach((section) => traverse(section.items, section.title))
    return found
  }, [navSections, isItemActive])

  useEffect(() => {
    const activeBranch = findActiveBranch()
    if (activeBranch) {
      setExpandedKey(activeBranch)
    }
  }, [findActiveBranch])

  const toggleGroup = (key: string) => {
    setExpandedKey((current) => (current === key ? null : key))
  }

  const renderNavItems = (
    items: NavItem[],
    parentKey: string,
    depth = 0,
  ): ReactNode => {
    return items.map((item) => {
      const key = `${parentKey}-${item.label}`
      const hasChildren = Boolean(item.children?.length)
      const childActive = hasChildren
        ? item.children!.some((child) => isItemActive(child))
        : false
      const isActive = (item.href && pathname === item.href) || childActive
      const isExpanded = hasChildren ? expandedKey === key : false
      const ItemIcon = item.icon

      if (hasChildren) {
        return (
          <div key={key} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup(key)}
              className={cn(
                'text-muted-foreground hover:text-primary flex w-full items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm transition-all',
                isActive && 'bg-muted text-primary',
              )}
              style={{
                paddingLeft: depth ? depth * 12 + 12 : undefined,
              }}
              aria-expanded={isExpanded}
              aria-controls={`${key}-panel`}
            >
              <span className="flex items-center gap-3">
                {ItemIcon ? (
                  <ItemIcon className="h-4 w-4" aria-hidden="true" />
                ) : null}
                {item.label}
              </span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            {item.children ? (
              <div
                id={`${key}-panel`}
                className={cn(
                  'overflow-hidden pl-4 transition-[max-height,opacity] duration-300 ease-in-out',
                  isExpanded
                    ? 'max-h-[480px] opacity-100'
                    : 'max-h-0 opacity-0',
                )}
                aria-hidden={!isExpanded}
              >
                <div className="space-y-1 pt-1">
                  {renderNavItems(item.children, key, depth + 1)}
                </div>
              </div>
            ) : null}
          </div>
        )
      }

      return (
        <Link
          key={key}
          href={item.href ?? '#'}
          className={cn(
            'text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-all',
            isActive && 'bg-muted text-primary',
          )}
          style={{
            paddingLeft: depth ? depth * 12 + 12 : undefined,
          }}
        >
          {ItemIcon ? (
            <ItemIcon className="h-4 w-4" aria-hidden="true" />
          ) : null}
          {item.label}
        </Link>
      )
    })
  }

  return (
    <div className="bg-muted/40 hidden h-screen border-r md:block">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex h-12 items-center border-b px-4 lg:h-[56px] lg:px-5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span>KubeCopilot</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-hidden">
          <div className="space-y-4 px-2 py-4 lg:px-3">
            {navSections.map((section) => (
              <nav
                key={section.title}
                className="space-y-2 text-sm font-medium"
              >
                <div className="px-3">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {section.title}
                  </p>
                  {section.description ? (
                    <p className="text-muted-foreground text-[11px]">
                      {section.description}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  {renderNavItems(section.items, section.title)}
                </div>
              </nav>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
