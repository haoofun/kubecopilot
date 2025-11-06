'use client'

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  Clock3,
  Command as CommandIcon,
  History,
  Loader2,
  Search,
  X,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { GlobalSearchResult } from '@/lib/k8s/types/search'
import { operationPlanFixtures } from '@/lib/operation-plan/mock-data'
import { describeOperation } from '@/components/operation-plan/utils'

interface CommandHistoryEntry {
  uid: string
  name: string
  href: string
  kind: string
  namespace?: string | null
  lastUsed: number
}

const HISTORY_STORAGE_KEY = 'kubecopilot.commandPalette.history'
const MIN_QUERY_LENGTH = 2
const HISTORY_LIMIT = 8
const SEARCH_DEBOUNCE_MS = 180

type PaletteGroup = {
  label: string
  icon: LucideIcon
  items: PaletteItem[]
}

type PaletteItem = {
  uid: string
  name: string
  href: string
  subtitle?: string
  kind: string
  namespace?: string | null
  source: 'search' | 'history' | 'plan'
}

const loadHistory = (): CommandHistoryEntry[] => {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as CommandHistoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn('[command-palette] failed to parse history', error)
    return []
  }
}

const persistHistory = (entries: CommandHistoryEntry[]) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries))
  } catch (error) {
    console.warn('[command-palette] failed to persist history', error)
  }
}

const buildPlanShortcuts = (): PaletteItem[] =>
  operationPlanFixtures.map((plan) => ({
    uid: `plan:${plan.id}`,
    name: describeOperation(plan),
    href: `/operation-plans/${plan.id}`,
    subtitle: plan.intent,
    kind: 'OperationPlan',
    namespace: plan.resource.namespace,
    source: 'plan' as const,
  }))

export function CommandPalette() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [history, setHistory] = useState<CommandHistoryEntry[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  const planShortcuts = useMemo(() => buildPlanShortcuts(), [])

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSearchValue('')
      setResults([])
      setError(null)
      setActiveIndex(0)
      return
    }
    inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setSearchValue(query.trim()),
      SEARCH_DEBOUNCE_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    if (searchValue.length < MIN_QUERY_LENGTH) {
      setResults([])
      setError(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const runSearch = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(
          `/api/k8s/search?q=${encodeURIComponent(searchValue)}`,
          {
            signal: controller.signal,
          },
        )
        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`)
        }
        const payload = (await response.json()) as {
          items: GlobalSearchResult[]
        }
        setResults(payload.items)
      } catch (fetchError) {
        if ((fetchError as Error).name === 'AbortError') {
          return
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Unexpected error while searching',
        )
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    runSearch()
    return () => controller.abort()
  }, [searchValue])

  const groupedItems = useMemo<PaletteGroup[]>(() => {
    if (searchValue.length >= MIN_QUERY_LENGTH) {
      const byKind = results.reduce<Record<string, PaletteItem[]>>(
        (acc, item) => {
          const existing = acc[item.kind] ?? []
          existing.push({
            uid: item.uid,
            name: item.name,
            href: item.href,
            subtitle: item.description ?? undefined,
            kind: item.kind,
            namespace: item.namespace,
            source: 'search',
          })
          acc[item.kind] = existing
          return acc
        },
        {},
      )

      return Object.entries(byKind)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([kind, items]) => ({
          label: kind,
          icon: Search,
          items,
        }))
    }

    const historyItems: PaletteItem[] = history
      .slice()
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, HISTORY_LIMIT)
      .map((entry) => ({
        uid: entry.uid,
        name: entry.name,
        href: entry.href,
        kind: entry.kind,
        namespace: entry.namespace,
        source: 'history',
      }))

    const groups: PaletteGroup[] = []
    if (historyItems.length > 0) {
      groups.push({
        label: 'Recent searches',
        icon: History,
        items: historyItems,
      })
    }

    groups.push({
      label: 'Operation plans',
      icon: Clock3,
      items: planShortcuts,
    })

    return groups
  }, [history, planShortcuts, results, searchValue])

  const flatItems = useMemo(
    () => groupedItems.flatMap((group) => group.items),
    [groupedItems],
  )

  useEffect(() => {
    if (activeIndex >= flatItems.length) {
      setActiveIndex(flatItems.length > 0 ? flatItems.length - 1 : 0)
    }
  }, [activeIndex, flatItems])

  const handleNavigate = useCallback(
    (item: PaletteItem) => {
      router.push(item.href)
      setIsOpen(false)
      setQuery('')
      setSearchValue('')
      setResults([])
      setError(null)
      setActiveIndex(0)
      setHistory((previous) => {
        const filtered = previous.filter((entry) => entry.uid !== item.uid)
        const next: CommandHistoryEntry[] = [
          {
            uid: item.uid,
            name: item.name,
            href: item.href,
            kind: item.kind,
            namespace: item.namespace,
            lastUsed: Date.now(),
          },
          ...filtered,
        ].slice(0, HISTORY_LIMIT)
        persistHistory(next)
        return next
      })
    },
    [router],
  )

  const hint = useMemo(() => {
    if (query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH) {
      return `Enter at least ${MIN_QUERY_LENGTH} characters to search.`
    }
    if (
      !flatItems.length &&
      searchValue.length >= MIN_QUERY_LENGTH &&
      !isLoading &&
      !error
    ) {
      return 'No resources matched your query.'
    }
    return null
  }, [error, flatItems.length, isLoading, query, searchValue])

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="text-muted-foreground inline-flex w-full items-center justify-between gap-2 rounded-lg border-dashed px-4 py-2 text-sm font-medium transition md:w-auto md:rounded-full"
        onClick={() => setIsOpen(true)}
      >
        <span className="inline-flex items-center gap-2">
          <CommandIcon className="h-4 w-4" aria-hidden />
          Quick actions
        </span>
        <span className="bg-muted flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
          <span className="hidden sm:inline">⌘</span>
          <span className="sm:hidden">Ctrl</span>
          <span>K</span>
        </span>
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-10 sm:py-20">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="bg-background relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-xl">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Search className="text-muted-foreground h-4 w-4" aria-hidden />
              <Input
                ref={inputRef}
                value={query}
                autoFocus
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pods, deployments, plans..."
                className="border-none shadow-none focus-visible:ring-0"
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    setActiveIndex((prev) =>
                      Math.min(prev + 1, flatItems.length - 1),
                    )
                  }
                  if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    setActiveIndex((prev) => Math.max(prev - 1, 0))
                  }
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    const target = flatItems[activeIndex]
                    if (target) {
                      handleNavigate(target)
                    }
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
                aria-label="Close command palette"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>

            <div className="relative max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 px-4 py-6 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Searching cluster…
                </div>
              ) : null}

              {error ? (
                <div className="text-destructive px-4 py-6 text-sm">
                  {error}
                </div>
              ) : null}

              {hint ? (
                <div className="text-muted-foreground px-4 py-6 text-sm">
                  {hint}
                </div>
              ) : null}

              {groupedItems.map((group, groupIndex) => (
                <Fragment key={group.label}>
                  <div className="text-muted-foreground flex items-center gap-2 px-4 pt-5 pb-2 text-xs font-semibold tracking-wide uppercase">
                    <group.icon className="h-3.5 w-3.5" aria-hidden />
                    <span>{group.label}</span>
                  </div>
                  <ul className="px-2 pb-2">
                    {group.items.map((item, itemIndex) => {
                      const flattenedIndex =
                        groupedItems
                          .slice(0, groupIndex)
                          .reduce(
                            (acc, current) => acc + current.items.length,
                            0,
                          ) + itemIndex
                      const isActive = flattenedIndex === activeIndex

                      return (
                        <li key={item.uid} className="px-2 py-1">
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(flattenedIndex)}
                            onClick={() => handleNavigate(item)}
                            className={cn(
                              'w-full rounded-xl border px-3 py-3 text-left transition-colors',
                              isActive
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'hover:border-muted hover:bg-muted/40 border-transparent bg-transparent',
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="leading-tight font-medium">
                                {item.name}
                              </div>
                              <ArrowUpRight
                                className="text-muted-foreground h-3.5 w-3.5"
                                aria-hidden
                              />
                            </div>
                            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                              {item.namespace ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] tracking-wide uppercase"
                                >
                                  {item.namespace}
                                </Badge>
                              ) : null}
                              <span>{item.kind}</span>
                              {item.subtitle ? (
                                <span className="truncate">
                                  {item.subtitle}
                                </span>
                              ) : null}
                              <span className="text-muted-foreground/70 text-[10px] tracking-wide uppercase">
                                {item.source === 'search'
                                  ? 'Live'
                                  : item.source === 'history'
                                    ? 'Recent'
                                    : 'Plan'}
                              </span>
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
