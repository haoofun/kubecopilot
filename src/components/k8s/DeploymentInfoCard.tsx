import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { V1Deployment } from '@kubernetes/client-node'

// 可复用的键值对行组件 (可以考虑未来提取到共享文件中)
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b py-2 last:border-b-0">
      <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
      <dd className="col-span-2 text-sm">{value || 'N/A'}</dd>
    </div>
  )
}

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
