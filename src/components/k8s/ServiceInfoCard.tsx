import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { V1Service } from '@kubernetes/client-node'
import { InfoRow } from '@/components/shared/InfoRow'

interface ServiceInfoCardProps {
  service: V1Service | undefined
}

export function ServiceInfoCard({ service }: ServiceInfoCardProps) {
  const spec = service?.spec
  const ports = spec?.ports
    ?.map(
      (p) =>
        `${p.name || ''}(${p.protocol || 'TCP'}) ${p.port}:${p.targetPort || 'N/A'}`,
    )
    .join(', ')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Information</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          <InfoRow label="Name" value={service?.metadata?.name} />
          <InfoRow label="Namespace" value={service?.metadata?.namespace} />
          <InfoRow label="Type" value={spec?.type} />
          <InfoRow label="Cluster IP" value={spec?.clusterIP} />
          <InfoRow label="Ports" value={ports} />
          <InfoRow
            label="Creation Timestamp"
            value={service?.metadata?.creationTimestamp?.toLocaleString()}
          />
        </dl>
      </CardContent>
    </Card>
  )
}
