import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { V1Pod } from '@kubernetes/client-node'

interface InfoRowProps {
  label: string
  value: React.ReactNode
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b py-2 last:border-b-0">
      <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
      <dd className="col-span-2 text-sm">{value || 'N/A'}</dd>
    </div>
  )
}

interface PodInfoCardProps {
  pod: V1Pod | undefined
}

export function PodInfoCard({ pod }: PodInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pod Information</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          <InfoRow label="Name" value={pod?.metadata?.name} />
          <InfoRow label="Namespace" value={pod?.metadata?.namespace} />
          <InfoRow label="Status" value={pod?.status?.phase} />
          <InfoRow label="Node" value={pod?.spec?.nodeName} />
          <InfoRow label="Pod IP" value={pod?.status?.podIP} />
          <InfoRow
            label="Service Account"
            value={pod?.spec?.serviceAccountName}
          />
          <InfoRow
            label="Creation Timestamp"
            value={pod?.metadata?.creationTimestamp?.toLocaleString()}
          />
        </dl>
      </CardContent>
    </Card>
  )
}
