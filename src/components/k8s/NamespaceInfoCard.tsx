import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { V1Namespace } from '@kubernetes/client-node'
import { InfoRow } from '@/components/shared/InfoRow'

interface NamespaceInfoCardProps {
  namespace: V1Namespace | undefined
}

export function NamespaceInfoCard({ namespace }: NamespaceInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Namespace Information</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          <InfoRow label="Name" value={namespace?.metadata?.name} />
          <InfoRow label="Status" value={namespace?.status?.phase} />
          <InfoRow
            label="Creation Timestamp"
            value={namespace?.metadata?.creationTimestamp?.toLocaleString()}
          />
        </dl>
      </CardContent>
    </Card>
  )
}
