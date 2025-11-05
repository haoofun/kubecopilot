import { formatDistanceToNow } from 'date-fns'

export function formatRelativeTime(
  value?: string | null,
  options?: Parameters<typeof formatDistanceToNow>[1],
): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  try {
    return formatDistanceToNow(date, options)
  } catch {
    return '—'
  }
}
