'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { DetailResponse, QueryParams } from '@domain-k8s/types/common'
import type { NamespaceSummary } from '@domain-k8s/types/namespace'

import {
  ResourceBrowserList,
  type ResourceBrowserColumn,
} from '@/components/resources/ResourceBrowserList'
import { ResourceFilterBar } from '@/components/resources/ResourceFilterBar'
import {
  useK8sResourceDetail,
  useK8sResourceList,
} from '@/hooks/useK8sResource'

const ALL_NAMESPACE_OPTION = { label: 'All namespaces', value: 'all' }

const TIME_RANGE_TO_MS: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
}

function isWithinTimeRange(timestamp?: string, range?: string) {
  if (!timestamp || !range || range === 'all') return true
  const cutoff = Date.now() - (TIME_RANGE_TO_MS[range] ?? 0)
  const createdAt = new Date(timestamp).getTime()
  if (Number.isNaN(createdAt)) return true
  return createdAt >= cutoff
}

type Option = {
  label: string
  value: string
}

export type ResourcePageFilters = {
  namespace: string
  status: string
  search: string
  label: string
  timeRange: string
}

type FilterContext<TSummary> = {
  filters: ResourcePageFilters
  matchesSearch: boolean
  matchesStatus: boolean
  matchesTimeRange: boolean
  row: TSummary
}

type InspectorProps<TDetail> = {
  detail?: DetailResponse<TDetail>
  isLoading?: boolean
}

export interface ResourcePageConfig<TSummary, TDetail> {
  resourceBase: string
  kind: string
  namespaced?: boolean
  showNamespaceFilter?: boolean
  statusLabel?: string
  statusOptions?: Option[]
  getStatus?: (row: TSummary) => string | undefined
  columns: ResourceBrowserColumn<TSummary>[]
  getRowId: (row: TSummary) => string
  getName: (row: TSummary) => string
  getNamespace?: (row: TSummary) => string | undefined
  getCreationTimestamp: (row: TSummary) => string | undefined
  getSearchValues?: (row: TSummary) => string[]
  filterFn?: (context: FilterContext<TSummary>) => boolean
  sortFn?: (a: TSummary, b: TSummary) => number
  detailParams?: QueryParams | ((row: TSummary) => QueryParams | undefined)
  listParams?:
    | QueryParams
    | ((filters: ResourcePageFilters) => QueryParams | undefined)
  inspector: React.ComponentType<InspectorProps<TDetail>>
  emptyMessage?: string
  selection?: {
    enabled?: boolean
    match?: (
      row: TSummary,
      selection: { name: string; namespace?: string | null },
    ) => boolean
  }
  defaultFilters?: Partial<ResourcePageFilters>
}

interface ResourcePageFactoryProps<TSummary, TDetail> {
  config: ResourcePageConfig<TSummary, TDetail>
}

export function ResourcePageFactory<TSummary, TDetail>({
  config,
}: ResourcePageFactoryProps<TSummary, TDetail>) {
  const namespaceEnabled = config.namespaced ?? true
  const showNamespaceFilter =
    config.showNamespaceFilter ?? namespaceEnabled ?? true
  const selectionEnabled = config.selection?.enabled ?? true
  const defaultFilters = config.defaultFilters ?? {}

  const [namespaceFilter, setNamespaceFilter] = useState(
    defaultFilters.namespace ?? 'all',
  )
  const [statusFilter, setStatusFilter] = useState(
    defaultFilters.status ?? 'all',
  )
  const [searchValue, setSearchValue] = useState(defaultFilters.search ?? '')
  const [labelFilter, setLabelFilter] = useState(defaultFilters.label ?? '')
  const [timeRange, setTimeRange] = useState(defaultFilters.timeRange ?? 'all')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [pendingSelection, setPendingSelection] = useState<{
    name: string
    namespace?: string | null
  } | null>(null)

  const searchParams = useSearchParams()

  const namespacesQuery = useK8sResourceList<NamespaceSummary>({
    resourceBase: 'namespaces',
    params: { limit: 500 },
  })

  const namespaceOptions = useMemo(() => {
    if (!namespaceEnabled) {
      return []
    }
    const items = namespacesQuery.data?.items ?? []
    const extra = items.map((ns) => ({ label: ns.name, value: ns.name }))
    return [ALL_NAMESPACE_OPTION, ...extra]
  }, [namespaceEnabled, namespacesQuery.data?.items])

  useEffect(() => {
    if (!selectionEnabled) return
    const selection = searchParams.get('selection')
    const namespace = searchParams.get('namespace')
    if (!selection) {
      setPendingSelection((prev) => (prev ? null : prev))
      return
    }
    setPendingSelection((prev) => {
      if (prev?.name === selection && prev.namespace === namespace) {
        return prev
      }
      return { name: selection, namespace }
    })
  }, [searchParams, selectionEnabled])

  const filters = useMemo<ResourcePageFilters>(
    () => ({
      namespace: namespaceFilter,
      status: statusFilter,
      search: searchValue,
      label: labelFilter,
      timeRange,
    }),
    [namespaceFilter, statusFilter, searchValue, labelFilter, timeRange],
  )

  const derivedListParams = useMemo(() => {
    const baseParams =
      typeof config.listParams === 'function'
        ? (config.listParams(filters) ?? {})
        : (config.listParams ?? {})
    const params: QueryParams = { ...baseParams }
    if (labelFilter) {
      params.labelSelector = labelFilter
    }
    return Object.keys(params).length > 0 ? params : undefined
  }, [config, filters, labelFilter])

  const listQuery = useK8sResourceList<TSummary>({
    resourceBase: config.resourceBase,
    namespace:
      namespaceEnabled && namespaceFilter !== 'all'
        ? namespaceFilter
        : undefined,
    params: derivedListParams,
  })

  const statusOptions = useMemo(() => {
    if (!config.statusOptions || config.statusOptions.length === 0) {
      return []
    }
    return [
      { label: 'All statuses', value: 'all' },
      ...config.statusOptions.filter((option) => option.value !== 'all'),
    ]
  }, [config.statusOptions])

  const rows = useMemo(() => {
    const items = listQuery.data?.items ?? []
    const filtered = items.filter((row) => {
      const statusValue = config.getStatus?.(row)
      const matchesStatus =
        statusOptions.length === 0 ||
        statusFilter === 'all' ||
        (statusValue ?? '').toLowerCase() === statusFilter.toLowerCase()

      const searchValues = config
        .getSearchValues?.(row)
        ?.map((value) => value.toLowerCase()) ?? [
        config.getName(row).toLowerCase(),
      ]

      const matchesSearch =
        searchValue.trim().length === 0
          ? true
          : searchValues.some((value) =>
              value.includes(searchValue.toLowerCase()),
            )

      const matchesTimeRange = isWithinTimeRange(
        config.getCreationTimestamp(row),
        timeRange,
      )

      const context: FilterContext<TSummary> = {
        filters,
        matchesSearch,
        matchesStatus,
        matchesTimeRange,
        row,
      }

      if (config.filterFn) {
        return config.filterFn(context)
      }

      return matchesStatus && matchesSearch && matchesTimeRange
    })

    if (config.sortFn) {
      return [...filtered].sort(config.sortFn)
    }

    return filtered
  }, [
    listQuery.data?.items,
    config,
    filters,
    statusOptions.length,
    statusFilter,
    searchValue,
    timeRange,
  ])

  useEffect(() => {
    if (rows.length === 0) {
      if (selectedRowId) {
        setSelectedRowId(null)
      }
      return
    }
    if (
      !selectedRowId ||
      !rows.some((row) => config.getRowId(row) === selectedRowId)
    ) {
      setSelectedRowId(config.getRowId(rows[0]))
      setPage(0)
    }
  }, [rows, selectedRowId, config])

  useEffect(() => {
    setPage((prev) => {
      const maxPage = Math.max(0, Math.ceil(rows.length / pageSize) - 1)
      return Math.min(prev, maxPage)
    })
  }, [rows.length, pageSize])

  useEffect(() => {
    setPage(0)
  }, [namespaceFilter, statusFilter, searchValue, labelFilter, timeRange])

  useEffect(() => {
    if (!selectionEnabled || !pendingSelection || listQuery.isLoading) {
      return
    }

    if (
      namespaceEnabled &&
      pendingSelection.namespace &&
      pendingSelection.namespace !== namespaceFilter
    ) {
      setNamespaceFilter(pendingSelection.namespace)
      return
    }

    const matchesSelection =
      config.selection?.match ??
      ((
        row: TSummary,
        selection: { name: string; namespace?: string | null },
      ) => {
        const matchesName =
          config.getName(row).toLowerCase() === selection.name.toLowerCase()
        if (!namespaceEnabled) return matchesName
        const rowNamespace = config.getNamespace?.(row)
        if (!selection.namespace) return matchesName
        return matchesName && rowNamespace === selection.namespace
      })

    const targetIndex = rows.findIndex((row) =>
      matchesSelection(row, pendingSelection),
    )

    if (targetIndex === -1) {
      setPendingSelection(null)
      return
    }

    const row = rows[targetIndex]
    setSelectedRowId(config.getRowId(row))
    const nextPage = Math.max(0, Math.floor(targetIndex / pageSize))
    if (nextPage !== page) {
      setPage(nextPage)
    }
    setPendingSelection(null)
  }, [
    selectionEnabled,
    pendingSelection,
    listQuery.isLoading,
    namespaceEnabled,
    namespaceFilter,
    rows,
    page,
    pageSize,
    config,
  ])

  const selectedRow = useMemo(
    () => rows.find((row) => config.getRowId(row) === selectedRowId),
    [rows, selectedRowId, config],
  )

  const detailParams = useMemo(() => {
    if (!selectedRow) return undefined
    if (typeof config.detailParams === 'function') {
      const params = config.detailParams(selectedRow)
      if (params) return params
    } else if (config.detailParams) {
      return config.detailParams
    }
    return {
      includeRaw: 'true',
      includeYaml: 'true',
    }
  }, [config, selectedRow])

  const detailQuery = useK8sResourceDetail<TDetail, unknown>({
    resourceBase: config.resourceBase,
    name: selectedRow ? config.getName(selectedRow) : '',
    namespace:
      namespaceEnabled && selectedRow
        ? config.getNamespace?.(selectedRow)
        : undefined,
    params: detailParams,
    enabled: Boolean(selectedRow),
  })

  const Inspector = config.inspector

  return (
    <div className="space-y-6">
      <ResourceFilterBar
        namespaceOptions={namespaceOptions}
        statusOptions={statusOptions}
        statusLabel={config.statusLabel}
        searchValue={searchValue}
        namespaceValue={namespaceFilter}
        statusValue={statusFilter}
        labelValue={labelFilter}
        timeRangeValue={timeRange}
        onSearchChange={setSearchValue}
        onNamespaceChange={namespaceEnabled ? setNamespaceFilter : undefined}
        onStatusChange={statusOptions.length ? setStatusFilter : undefined}
        onLabelChange={setLabelFilter}
        onTimeRangeChange={setTimeRange}
        showNamespace={showNamespaceFilter}
      />
      <ResourceBrowserList<TSummary>
        data={rows}
        columns={config.columns}
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        error={listQuery.error}
        rowKey={config.getRowId}
        selectedRowId={selectedRowId}
        onSelect={(row) => setSelectedRowId(config.getRowId(row))}
        emptyMessage={
          config.emptyMessage ?? 'No resources match the current filters.'
        }
        pagination={{
          page,
          pageSize,
          totalItems: rows.length,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size)
            setPage(0)
          },
        }}
      />
      <Inspector detail={detailQuery.data} isLoading={detailQuery.isLoading} />
    </div>
  )
}
