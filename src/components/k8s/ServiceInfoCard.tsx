import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { V1Service } from '@kubernetes/client-node'

// 可复用的键值对行组件 (可以考虑未来提取到共享文件中)
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b py-2 last:border-b-0">
      <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
      <dd className="col-span-2 text-sm">{value || 'N/A'}</dd>
    </div>
  )
}

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
