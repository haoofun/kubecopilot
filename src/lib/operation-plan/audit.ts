type AuditEventType =
  | 'plan.generated'
  | 'plan.execution.attempt'
  | 'plan.execution.success'
  | 'plan.execution.failure'
  | 'plan.dismissed'

export interface AuditEvent {
  type: AuditEventType
  planId: string
  actor: string
  metadata?: Record<string, unknown>
}

export function recordAuditEvent(event: AuditEvent) {
  const timestamp = new Date().toISOString()
  const payload = {
    ...event,
    timestamp,
  }

  if (process.env.NODE_ENV === 'test') {
    return
  }

  const label = `[audit] ${event.type}`
  if (event.type.endsWith('failure')) {
    console.error(label, payload)
    return
  }

  console.info(label, payload)
}
