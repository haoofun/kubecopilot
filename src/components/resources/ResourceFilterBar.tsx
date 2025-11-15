'use client'

import { ChangeEvent, ReactNode } from 'react'

import { Input } from '@ui-kit/input'
import { Label } from '@ui-kit/label'
import { cn } from '@/lib/utils'

type Option = {
  label: string
  value: string
}

const DEFAULT_TIME_RANGES: Option[] = [
  { label: 'Any time', value: 'all' },
  { label: 'Last hour', value: '1h' },
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
]

export interface ResourceFilterBarProps {
  namespaceOptions?: Option[]
  statusOptions?: Option[]
  searchValue: string
  namespaceValue?: string
  statusValue?: string
  labelValue: string
  timeRangeValue: string
  showNamespace?: boolean
  variant?: 'toolbar' | 'stack'
  statusLabel?: string
  onSearchChange: (value: string) => void
  onNamespaceChange?: (value: string) => void
  onStatusChange?: (value: string) => void
  onLabelChange: (value: string) => void
  onTimeRangeChange: (value: string) => void
  actions?: ReactNode
}

export function ResourceFilterBar({
  namespaceOptions = [],
  statusOptions = [],
  searchValue,
  namespaceValue = 'all',
  statusValue = 'all',
  labelValue,
  timeRangeValue,
  showNamespace = true,
  variant = 'toolbar',
  statusLabel = 'Status',
  actions,
  onSearchChange,
  onNamespaceChange,
  onStatusChange,
  onLabelChange,
  onTimeRangeChange,
}: ResourceFilterBarProps) {
  const handleNamespaceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onNamespaceChange?.(event.target.value)
  }

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onStatusChange?.(event.target.value)
  }

  const handleLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
    onLabelChange(event.target.value)
  }

  const handleTimeRangeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onTimeRangeChange(event.target.value)
  }

  const isToolbar = variant === 'toolbar'

  return (
    <div
      className={cn(
        'bg-card/80 rounded-xl border p-4 shadow-sm',
        !isToolbar && 'bg-transparent',
      )}
    >
      <div
        className={cn(
          'grid gap-4',
          isToolbar
            ? 'md:grid-cols-2 lg:grid-cols-4'
            : 'sm:grid-cols-2 md:grid-cols-3',
        )}
      >
        <div className="space-y-1">
          <Label htmlFor="resource-search">Search</Label>
          <Input
            id="resource-search"
            placeholder="Search by name"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        {showNamespace ? (
          <div className="space-y-1">
            <Label htmlFor="resource-namespace">Namespace</Label>
            <select
              id="resource-namespace"
              value={namespaceValue}
              onChange={handleNamespaceChange}
              className="bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
            >
              {namespaceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {statusOptions.length ? (
          <div className="space-y-1">
            <Label htmlFor="resource-status">{statusLabel}</Label>
            <select
              id="resource-status"
              value={statusValue}
              onChange={handleStatusChange}
              className="bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="space-y-1">
          <Label htmlFor="resource-labels">Label selector</Label>
          <Input
            id="resource-labels"
            placeholder="app=my-service"
            value={labelValue}
            onChange={handleLabelChange}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="resource-time-range">Created</Label>
          <select
            id="resource-time-range"
            value={timeRangeValue}
            onChange={handleTimeRangeChange}
            className="bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
          >
            {DEFAULT_TIME_RANGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {actions ? (
          <div className="flex items-end justify-end">{actions}</div>
        ) : null}
      </div>
    </div>
  )
}
