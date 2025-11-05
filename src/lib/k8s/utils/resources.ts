import type { V1Container } from '@kubernetes/client-node'

type QuantityParser = (value: string) => number | undefined

const CPU_MILLI_FACTOR = 1000

const BINARY_UNITS = [
  { suffix: 'Ei', factor: 1024 ** 6 },
  { suffix: 'Pi', factor: 1024 ** 5 },
  { suffix: 'Ti', factor: 1024 ** 4 },
  { suffix: 'Gi', factor: 1024 ** 3 },
  { suffix: 'Mi', factor: 1024 ** 2 },
  { suffix: 'Ki', factor: 1024 },
] as const

const DECIMAL_UNITS = [
  { suffix: 'E', factor: 1_000_000_000_000_000_000 },
  { suffix: 'P', factor: 1_000_000_000_000_000 },
  { suffix: 'T', factor: 1_000_000_000_000 },
  { suffix: 'G', factor: 1_000_000_000 },
  { suffix: 'M', factor: 1_000_000 },
  { suffix: 'K', factor: 1_000 },
] as const

const normalizeQuantity = (
  raw: string | undefined | null,
): string | undefined => {
  if (raw === undefined || raw === null) {
    return undefined
  }
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const parseCpuQuantity = (
  raw: string | undefined | null,
): number | undefined => {
  const quantity = normalizeQuantity(raw)
  if (!quantity) {
    return undefined
  }

  if (quantity.endsWith('m')) {
    const numeric = Number.parseFloat(quantity.slice(0, -1))
    return Number.isFinite(numeric) ? numeric : undefined
  }

  const numeric = Number.parseFloat(quantity)
  return Number.isFinite(numeric) ? numeric * CPU_MILLI_FACTOR : undefined
}

const parseWithUnits = (
  raw: string,
  units: readonly { suffix: string; factor: number }[],
  caseSensitive = true,
): number | undefined => {
  const candidate = caseSensitive ? raw : raw.toUpperCase()
  for (const { suffix, factor } of units) {
    const matchSuffix = caseSensitive ? suffix : suffix.toUpperCase()
    if (candidate.endsWith(matchSuffix)) {
      const numeric = Number.parseFloat(raw.slice(0, -suffix.length))
      if (Number.isFinite(numeric)) {
        return numeric * factor
      }
      return undefined
    }
  }
  return undefined
}

export const parseMemoryQuantity = (
  raw: string | undefined | null,
): number | undefined => {
  const quantity = normalizeQuantity(raw)
  if (!quantity) {
    return undefined
  }

  const binary = parseWithUnits(quantity, BINARY_UNITS)
  if (binary !== undefined) {
    return binary
  }

  const decimal = parseWithUnits(quantity, DECIMAL_UNITS, false)
  if (decimal !== undefined) {
    return decimal
  }

  const numeric = Number.parseFloat(quantity)
  return Number.isFinite(numeric) ? numeric : undefined
}

export const formatCpuQuantity = (milliCores: number): string => {
  if (!Number.isFinite(milliCores) || milliCores <= 0) {
    return '0'
  }

  if (milliCores % CPU_MILLI_FACTOR === 0) {
    return (milliCores / CPU_MILLI_FACTOR).toString()
  }

  const cores = milliCores / CPU_MILLI_FACTOR
  return cores >= 0.1
    ? cores.toFixed(2).replace(/\.?0+$/, '')
    : `${Math.round(milliCores)}m`
}

export const formatMemoryQuantity = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0'
  }

  for (const { suffix, factor } of BINARY_UNITS) {
    if (bytes >= factor) {
      const value = bytes / factor
      return value >= 10
        ? `${Math.round(value)}${suffix}`
        : `${value.toFixed(1).replace(/\.0$/, '')}${suffix}`
    }
  }

  if (bytes >= 1000) {
    const value = bytes / 1000
    return value >= 10
      ? `${Math.round(value)}k`
      : `${value.toFixed(1).replace(/\.0$/, '')}k`
  }

  return `${Math.round(bytes)}B`
}

const sumQuantities = (
  containers: V1Container[],
  selector: (container: V1Container) => string | undefined,
  parser: QuantityParser,
): { total?: number; hasValue: boolean } => {
  let total = 0
  let hasValue = false

  for (const container of containers) {
    const raw = selector(container)
    const parsed = raw ? parser(raw) : undefined
    if (parsed !== undefined) {
      total += parsed
      hasValue = true
    }
  }

  return { total: hasValue ? total : undefined, hasValue }
}

const toAggregatedStrings = (
  aggregated: { total?: number; hasValue: boolean },
  formatter: (value: number) => string,
): string | undefined => {
  if (!aggregated.hasValue || aggregated.total === undefined) {
    return undefined
  }
  return formatter(aggregated.total)
}

export const aggregateContainerResources = (containers: V1Container[] = []) => {
  const cpuRequests = sumQuantities(
    containers,
    (container) => container.resources?.requests?.cpu,
    parseCpuQuantity,
  )
  const cpuLimits = sumQuantities(
    containers,
    (container) => container.resources?.limits?.cpu,
    parseCpuQuantity,
  )

  const memoryRequests = sumQuantities(
    containers,
    (container) => container.resources?.requests?.memory,
    parseMemoryQuantity,
  )
  const memoryLimits = sumQuantities(
    containers,
    (container) => container.resources?.limits?.memory,
    parseMemoryQuantity,
  )

  return {
    requests: {
      cpu: toAggregatedStrings(cpuRequests, formatCpuQuantity),
      memory: toAggregatedStrings(memoryRequests, formatMemoryQuantity),
    },
    limits: {
      cpu: toAggregatedStrings(cpuLimits, formatCpuQuantity),
      memory: toAggregatedStrings(memoryLimits, formatMemoryQuantity),
    },
  }
}
