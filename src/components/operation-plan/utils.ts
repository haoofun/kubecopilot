import type { OperationPlan } from '@/lib/operation-plan/types'

const pointerToSegments = (pointer: string) =>
  pointer
    .split('/')
    .slice(1)
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

export const applyPlanPatch = (
  base: Record<string, unknown> | null,
  patch: OperationPlan['diff']['patch'],
) => {
  if (!base) {
    return null
  }

  const next = clone(base)

  const assignValue = (
    target: Record<string, unknown> | unknown[],
    path: string[],
    op: 'add' | 'replace' | 'remove',
    value?: unknown,
  ) => {
    const lastSegment = path[path.length - 1]
    let current: Record<string, unknown> | unknown[] = target

    for (let i = 0; i < path.length - 1; i += 1) {
      const segment = path[i]
      if (Array.isArray(current)) {
        const index = Number(segment)
        if (!Number.isInteger(index)) {
          throw new Error(`Invalid array index: ${segment}`)
        }
        if (current[index] === undefined) {
          current[index] = {}
        }
        current = current[index] as Record<string, unknown> | unknown[]
      } else {
        if (!(segment in current)) {
          current[segment] = {}
        }
        current = current[segment] as Record<string, unknown> | unknown[]
      }
    }

    if (Array.isArray(current)) {
      const index = Number(lastSegment)
      if (!Number.isInteger(index)) {
        throw new Error(`Invalid array index: ${lastSegment}`)
      }
      if (op === 'remove') {
        current.splice(index, 1)
      } else {
        current[index] = value as never
      }
      return
    }

    if (op === 'remove') {
      delete current[lastSegment]
      return
    }

    current[lastSegment] = value as never
  }

  patch.forEach((operation) => {
    const path = pointerToSegments(operation.path)
    assignValue(next, path, operation.op, operation.value)
  })

  return next
}

export const computeAfterState = (plan: OperationPlan) => {
  try {
    return applyPlanPatch(plan.diff.before, plan.diff.patch)
  } catch (error) {
    console.warn('[operation-plan] failed to compute after snapshot', error)
    return null
  }
}

export const describeOperation = (plan: OperationPlan) => {
  const target = `${plan.resource.kind} · ${plan.resource.namespace}/${plan.resource.name}`
  switch (plan.action) {
    case 'create':
      return `Create ${target}`
    case 'delete':
      return `Delete ${target}`
    case 'restart':
      return `Restart ${target}`
    case 'scale':
      return `Scale ${target}`
    case 'update':
    default:
      return `Update ${target}`
  }
}
