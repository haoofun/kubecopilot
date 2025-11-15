import { notFound } from 'next/navigation'

import { OperationPlanDetail } from '@/components/operation-plan'
import { findOperationPlanById } from '@/lib/operation-plan/mock-data'

export default function OperationPlanDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const plan = findOperationPlanById(params.id)

  if (!plan) {
    notFound()
  }

  return <OperationPlanDetail plan={plan} />
}
