'use client'

import { type ReactNode, useMemo } from 'react'

import { Alert, AlertDescription } from '@ui-kit/alert'
import { Button } from '@ui-kit/button'
import { Label } from '@ui-kit/label'
import { Skeleton } from '@ui-kit/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui-kit/table'
import { cn } from '@/lib/utils'

export type ResourceBrowserColumn<T> = {
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

interface PaginationState {
  page: number
  pageSize: number
  totalItems?: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export interface ResourceBrowserListProps<T> {
  data?: T[]
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  columns: ResourceBrowserColumn<T>[]
  rowKey: (row: T) => string
  selectedRowId?: string | null
  onSelect?: (row: T) => void
  emptyMessage?: string
  maxHeight?: number | string
  pagination?: PaginationState
  footer?: ReactNode
}

export function ResourceBrowserList<T>({
  data,
  isLoading,
  isError,
  error,
  columns,
  rowKey,
  selectedRowId,
  onSelect,
  emptyMessage = 'No resources found.',
  maxHeight = '65vh',
  pagination,
  footer,
}: ResourceBrowserListProps<T>) {
  const rows = useMemo(() => data ?? [], [data])

  const paginatedRows = useMemo(() => {
    if (!pagination) return rows
    const totalItems = pagination.totalItems ?? rows.length
    const maxPage = Math.max(0, Math.ceil(totalItems / pagination.pageSize) - 1)
    const safePage = Math.min(pagination.page, maxPage)
    const start = safePage * pagination.pageSize
    const end = start + pagination.pageSize
    return rows.slice(start, end)
  }, [rows, pagination])

  const derivedFooter = useMemo(() => {
    if (footer) return footer
    if (!pagination) return undefined
    const {
      page,
      pageSize,
      totalItems = rows.length,
      pageSizeOptions = [10, 25, 50],
      onPageChange,
      onPageSizeChange,
    } = pagination
    const start = totalItems === 0 ? 0 : page * pageSize + 1
    const end =
      totalItems === 0 ? 0 : Math.min(totalItems, (page + 1) * pageSize)
    const maxPage = Math.max(0, Math.ceil(totalItems / pageSize) - 1)

    return (
      <div className="text-muted-foreground flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
        <span>
          Showing {start || 0}–{end || 0} of {totalItems} resources
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {onPageSizeChange ? (
            <div className="flex items-center gap-2">
              <Label
                htmlFor="resource-list-page-size"
                className="text-xs uppercase"
              >
                Rows
              </Label>
              <select
                id="resource-list-page-size"
                value={pageSize}
                onChange={(event) =>
                  onPageSizeChange?.(Number(event.target.value))
                }
                className="bg-background focus-visible:ring-ring rounded-md border px-2 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-muted-foreground text-xs">
              Page {page + 1} of {maxPage + 1 || 1}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(maxPage, page + 1))}
              disabled={page >= maxPage || totalItems === 0}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    )
  }, [footer, pagination, rows.length])

  if (isLoading) {
    return (
      <div className="bg-card/60 space-y-3 rounded-xl border p-5 shadow-sm">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error?.message ?? 'Failed to load resources.'}
        </AlertDescription>
      </Alert>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-card/60 text-muted-foreground rounded-xl border p-8 text-center shadow-sm">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="bg-card/80 overflow-hidden rounded-xl border shadow-sm">
      <div className="overflow-auto" style={{ maxHeight }}>
        <Table>
          <TableHeader className="bg-card/95 sticky top-0 z-10 backdrop-blur">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.header} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row) => {
              const key = rowKey(row)
              const isSelected = selectedRowId === key
              return (
                <TableRow
                  key={key}
                  onClick={() => onSelect?.(row)}
                  className={cn(
                    'hover:bg-muted/50 cursor-pointer transition-colors',
                    isSelected && 'bg-primary/5',
                  )}
                >
                  {columns.map((column) => (
                    <TableCell key={column.header} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      {derivedFooter ? (
        <div className="bg-card/80 text-muted-foreground border-t px-4 py-3 text-sm">
          {derivedFooter}
        </div>
      ) : null}
    </div>
  )
}
