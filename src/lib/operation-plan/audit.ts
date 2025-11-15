import { prisma } from '@/lib/prisma'

/** Enumerates all lifecycle events the operation-plan workflow records for compliance. */
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

/**
 * Persists audit events for every plan action so reviewers can trace AI-driven changes across the observability system.
 */
export async function recordAuditEvent(event: AuditEvent) {
  const timestamp = new Date().toISOString()
  const payload = {
    ...event,
    timestamp,
  }

  if (process.env.NODE_ENV !== 'test') {
    const label = `[audit] ${event.type}`
    if (event.type.endsWith('failure')) {
      console.error(label, payload)
    } else {
      console.info(label, payload)
    }
  }

  try {
    await prisma.auditEvent.create({
      data: {
        planId: event.planId,
        type: event.type,
        actor: event.actor,
        metadata: event.metadata ?? null,
      },
    })
  } catch (error) {
    console.error('[audit] failed to persist audit event', {
      error,
      event,
    })
  }
}
