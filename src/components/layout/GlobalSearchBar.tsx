'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, Search } from 'lucide-react'

import { Input } from '@ui-kit/input'
import { Badge } from '@ui-kit/badge'
import { cn } from '@/lib/utils'
import type {
  GlobalSearchResponse,
  GlobalSearchResult,
} from '@domain-k8s/types/search'

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_DELAY = 250

interface GroupedResults {
  kind: string
  items: GlobalSearchResult[]
}

interface GlobalSearchBarProps {
  className?: string
}

export function GlobalSearchBar({ className }: GlobalSearchBarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchValue(inputValue.trim())
    }, DEBOUNCE_DELAY)

    return () => window.clearTimeout(timeoutId)
  }, [inputValue])

  useEffect(() => {
    if (searchValue.length < MIN_QUERY_LENGTH) {
      setResults([])
      setError(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const fetchResults = async () => {
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

        const data = (await response.json()) as GlobalSearchResponse
        setResults(data.items)
      } catch (fetchError) {
        if ((fetchError as Error).name === 'AbortError') {
          return
        }

        const message =
          fetchError instanceof Error
            ? fetchError.message
            : 'Unexpected error while searching'
        setError(message)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()

    return () => controller.abort()
  }, [searchValue])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) {
        return
      }
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  const groupedResults = useMemo<GroupedResults[]>(() => {
    const byKind = results.reduce<Record<string, GlobalSearchResult[]>>(
      (acc, item) => {
        if (!acc[item.kind]) {
          acc[item.kind] = []
        }
        acc[item.kind].push(item)
        return acc
      },
      {},
    )

    return Object.entries(byKind)
      .map(([kind, items]) => ({ kind, items }))
      .sort((a, b) => a.kind.localeCompare(b.kind))
  }, [results])

  const showMinHint =
    inputValue.trim().length > 0 && searchValue.length < MIN_QUERY_LENGTH

  const shouldShowDropdown =
    isOpen &&
    (isLoading ||
      error ||
      groupedResults.length > 0 ||
      showMinHint ||
      searchValue.length >= MIN_QUERY_LENGTH)

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full max-w-xl', className)}
    >
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false)
            }
          }}
          placeholder="Search cluster resources..."
          aria-label="Global search"
          className="pl-9"
        />
        {isLoading && (
          <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
        )}
      </div>

      {shouldShowDropdown && (
        <div className="bg-popover text-popover-foreground absolute top-full right-0 left-0 z-50 mt-2 origin-top rounded-lg border shadow-lg">
          <div className="max-h-[22rem] overflow-y-auto p-3">
            {showMinHint && (
              <p className="text-muted-foreground text-sm">
                Enter at least {MIN_QUERY_LENGTH} characters to search.
              </p>
            )}

            {error && (
              <p className="text-destructive text-sm">
                {error}. Please try again.
              </p>
            )}

            {!error &&
              !showMinHint &&
              groupedResults.length === 0 &&
              !isLoading &&
              searchValue.length >= MIN_QUERY_LENGTH && (
                <p className="text-muted-foreground text-sm">
                  No matching resources found.
                </p>
              )}

            {groupedResults.map((group) => (
              <section
                key={group.kind}
                className="space-y-2 py-2 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2 px-2">
                  <Badge variant="secondary">{group.kind}</Badge>
                  <span className="text-muted-foreground text-xs tracking-wide uppercase">
                    {group.items.length} result
                    {group.items.length > 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="divide-border divide-y overflow-hidden rounded-md border">
                  {group.items.map((item) => (
                    <li key={item.uid}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'hover:bg-muted/70 focus:bg-muted/70 focus:outline-none',
                          'flex flex-col gap-1 px-4 py-3 transition-colors',
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.namespace && (
                            <span className="text-muted-foreground text-xs tracking-wide uppercase">
                              {item.namespace}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <span className="text-muted-foreground text-sm">
                            {item.description}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
