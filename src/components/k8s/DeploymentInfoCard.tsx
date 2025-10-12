import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { V1Deployment } from '@kubernetes/client-node'
import { InfoRow } from '@/components/shared/InfoRow'

interface DeploymentInfoCardProps {
  deployment: V1Deployment | undefined
}

export function DeploymentInfoCard({ deployment }: DeploymentInfoCardProps) {
  const spec = deployment?.spec
  const status = deployment?.status

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Information</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          <InfoRow label="Name" value={deployment?.metadata?.name} />
          <InfoRow label="Namespace" value={deployment?.metadata?.namespace} />
          <InfoRow label="Strategy" value={spec?.strategy?.type} />
          <InfoRow
            label="Replicas"
            value={`${status?.readyReplicas || 0} ready / ${spec?.replicas} desired`}
          />
          <InfoRow
            label="Creation Timestamp"
            value={deployment?.metadata?.creationTimestamp?.toLocaleString()}
          />
        </dl>
      </CardContent>
    </Card>
  )
}
