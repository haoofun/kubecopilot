'use client'

import React from 'react'
import Link from 'next/link'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface ColumnDef<T> {
  header: string
  accessorKey?: string
  cell: (item: T) => React.ReactNode
  className?: string
}

interface PaginationOptions {
  page: number
  pageSize: number
  totalItems: number
  mode?: 'client' | 'server'
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
}

interface VirtualizationOptions {
  enabled?: boolean
  rowHeight?: number
  overscan?: number
  maxHeight?: number | string
}

interface ResourceTableProps<T> {
  columns: ColumnDef<T>[]
  data?: T[]
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  rowKey: (item: T) => string
  linkGenerator?: (item: T) => string
  emptyMessage?: string
  toolbar?: React.ReactNode
  pagination?: PaginationOptions
  virtualization?: VirtualizationOptions
}

const DEFAULT_ROW_HEIGHT = 48
const DEFAULT_OVERSCAN = 4

export function ResourceTable<T>({
  columns,
  data,
  isLoading,
  isError,
  error,
  rowKey,
  linkGenerator,
  emptyMessage = 'No data available.',
  toolbar,
  pagination,
  virtualization,
}: ResourceTableProps<T>) {
  const resolvedData = React.useMemo(() => data ?? [], [data])

  const paginationMode =
    pagination?.mode ??
    (pagination && pagination.totalItems === resolvedData.length
      ? 'client'
      : 'server')

  const pagedData = React.useMemo(() => {
    if (!pagination || paginationMode === 'server') {
      return resolvedData
    }
    const start = pagination.page * pagination.pageSize
    return resolvedData.slice(start, start + pagination.pageSize)
  }, [resolvedData, pagination, paginationMode])

  const virtualizationEnabled = virtualization?.enabled ?? false
  const rowHeight = virtualization?.rowHeight ?? DEFAULT_ROW_HEIGHT
  const overscan = virtualization?.overscan ?? DEFAULT_OVERSCAN

  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [viewportHeight, setViewportHeight] = React.useState(0)
  const [scrollTop, setScrollTop] = React.useState(0)

  React.useEffect(() => {
    if (!virtualizationEnabled) {
      return
    }
    const element = containerRef.current
    if (!element) {
      return
    }

    const handleResize = () => {
      setViewportHeight(element.clientHeight)
    }
    const handleScroll = () => {
      setScrollTop(element.scrollTop)
    }

    handleResize()
    element.addEventListener('scroll', handleScroll)

    let resizeObserver: ResizeObserver | null = null
    let removeWindowResizeListener: (() => void) | null = null

    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(element)
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      removeWindowResizeListener = () =>
        window.removeEventListener('resize', handleResize)
    }

    return () => {
      element.removeEventListener('scroll', handleScroll)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (removeWindowResizeListener) {
        removeWindowResizeListener()
      }
    }
  }, [virtualizationEnabled])

  React.useEffect(() => {
    if (!virtualizationEnabled) {
      return
    }
    const container = containerRef.current
    if (container) {
      container.scrollTop = 0
    }
    setScrollTop(0)
  }, [virtualizationEnabled, pagedData])

  const dataLength = pagedData.length

  const { startIndex, endIndex, beforePadding, afterPadding } =
    React.useMemo(() => {
      if (!virtualizationEnabled || viewportHeight === 0) {
        return {
          startIndex: 0,
          endIndex: dataLength,
          beforePadding: 0,
          afterPadding: 0,
        }
      }

      const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2
      const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
      const end = Math.min(dataLength, start + visibleCount)
      return {
        startIndex: start,
        endIndex: end,
        beforePadding: start * rowHeight,
        afterPadding: Math.max(0, (dataLength - end) * rowHeight),
      }
    }, [
      virtualizationEnabled,
      viewportHeight,
      scrollTop,
      dataLength,
      rowHeight,
      overscan,
    ])

  const visibleRows = virtualizationEnabled
    ? pagedData.slice(startIndex, endIndex)
    : pagedData

  const virtualizationContainerStyle = React.useMemo(() => {
    if (!virtualizationEnabled) {
      return undefined
    }

    if (typeof virtualization?.maxHeight === 'number') {
      return { maxHeight: `${virtualization.maxHeight}px` }
    }

    if (typeof virtualization?.maxHeight === 'string') {
      return { maxHeight: virtualization.maxHeight }
    }

    return { maxHeight: '32rem' }
  }, [virtualizationEnabled, virtualization?.maxHeight])

  const renderRow = (item: T) => (
    <TableRow
      key={rowKey(item)}
      style={virtualizationEnabled ? { height: `${rowHeight}px` } : undefined}
    >
      {columns.map((col, colIndex) => {
        const cellContent = col.cell(item)

        if (colIndex === 0 && linkGenerator) {
          return (
            <TableCell
              key={col.accessorKey || col.header || colIndex}
              className="font-medium"
            >
              <Link
                href={linkGenerator(item)}
                className="text-primary hover:underline"
              >
                {cellContent}
              </Link>
            </TableCell>
          )
        }

        return (
          <TableCell key={col.accessorKey || col.header || colIndex}>
            {cellContent}
          </TableCell>
        )
      })}
    </TableRow>
  )

  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, rowIndex) => (
      <TableRow key={`skeleton-${rowIndex}`}>
        {columns.map((col, colIndex) => (
          <TableCell key={`skeleton-${rowIndex}-${colIndex}`}>
            <Skeleton className={`h-4 ${col.className || 'w-full'}`} />
          </TableCell>
        ))}
      </TableRow>
    ))

  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-24 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </TableCell>
    </TableRow>
  )

  const renderPaddingRow = (height: number, position: 'before' | 'after') => {
    if (height <= 0) {
      return null
    }
    return (
      <TableRow aria-hidden="true" key={`padding-${position}`}>
        <TableCell
          colSpan={columns.length}
          style={{ height, padding: 0, border: 'none' }}
        />
      </TableRow>
    )
  }

  const totalItems = pagination?.totalItems ?? resolvedData.length
  const totalPages =
    pagination && pagination.pageSize > 0
      ? Math.ceil(totalItems / pagination.pageSize)
      : 0

  const paginationControls =
    pagination && totalPages > 1 ? (
      <div className="flex flex-col gap-2 pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground">
          Showing{' '}
          <span className="font-medium">
            {Math.min(totalItems, pagination.page * pagination.pageSize + 1)}
          </span>{' '}
          to{' '}
          <span className="font-medium">
            {Math.min(totalItems, (pagination.page + 1) * pagination.pageSize)}
          </span>{' '}
          of <span className="font-medium">{totalItems}</span> results
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => pagination.onPageChange?.(pagination.page - 1)}
            disabled={pagination.page === 0 || !pagination.onPageChange}
          >
            Previous
          </Button>
          <span>
            Page <span className="font-medium">{pagination.page + 1}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => pagination.onPageChange?.(pagination.page + 1)}
            disabled={
              pagination.page + 1 >= totalPages || !pagination.onPageChange
            }
          >
            Next
          </Button>
        </div>
      </div>
    ) : null

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error?.message || 'Failed to load resources.'}
        </AlertDescription>
      </Alert>
    )
  }

  const tableElement = (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, index) => (
            <TableHead key={col.accessorKey || col.header || index}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          renderSkeletonRows()
        ) : visibleRows.length > 0 ? (
          <>
            {renderPaddingRow(beforePadding, 'before')}
            {visibleRows.map((item) => renderRow(item))}
            {renderPaddingRow(afterPadding, 'after')}
          </>
        ) : (
          renderEmptyState()
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-3">
      {toolbar}
      {virtualizationEnabled ? (
        <div
          ref={containerRef}
          className="overflow-auto"
          style={virtualizationContainerStyle}
        >
          {tableElement}
        </div>
      ) : (
        tableElement
      )}
      {paginationControls}
    </div>
  )
}
