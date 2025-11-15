import type { CoreV1Event } from '@kubernetes/client-node'
import type { K8sEvent } from '../types/event'

/** Normalizes timestamps so the observability board can plot event timelines with ISO strings straight from Kubernetes data. */
const toIsoString = (
  value: Date | string | null | undefined,
): string | undefined => {
  if (!value) {
    return undefined
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return undefined
}

/** Picks the first non-empty timestamp, ensuring the board always has a value to show even when Kubernetes omits some fields. */
const normalizeTimestamp = (...timestamps: Array<string | undefined>): string =>
  timestamps.find((value) => value && value.length > 0) ?? ''

/** Ensures event types collapse to Normal/Warning for consistent color coding. */
const normalizeEventType = (type: string | undefined): K8sEvent['type'] =>
  type === 'Warning' ? 'Warning' : 'Normal'

/** Converts a raw Kubernetes Event into the UI-friendly K8sEvent structure consumed by the observability board. */
export const transformEventToK8sEvent = (event: CoreV1Event): K8sEvent => ({
  uid: event.metadata?.uid ?? '',
  reason: event.reason ?? '',
  message: event.message ?? '',
  type: normalizeEventType(event.type ?? undefined),
  sourceComponent: event.source?.component ?? event.reportingComponent ?? '',
  sourceHost: event.source?.host ?? event.reportingInstance ?? '',
  count: event.count ?? 1,
  firstTimestamp: normalizeTimestamp(
    toIsoString(event.firstTimestamp ?? undefined),
    toIsoString(event.eventTime ?? undefined),
    toIsoString(event.metadata?.creationTimestamp ?? undefined),
  ),
  lastTimestamp: normalizeTimestamp(
    toIsoString(event.lastTimestamp ?? undefined),
    toIsoString(event.eventTime ?? undefined),
    toIsoString(event.metadata?.creationTimestamp ?? undefined),
  ),
  involvedObject: {
    kind: event.involvedObject?.kind ?? '',
    name: event.involvedObject?.name ?? '',
    namespace: event.involvedObject?.namespace ?? '',
    uid: event.involvedObject?.uid ?? '',
  },
})
