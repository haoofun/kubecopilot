import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { V1Namespace } from '@kubernetes/client-node'

// 可复用的键值对行组件 (可以考虑未来提取到共享文件中)
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b py-2 last:border-b-0">
      <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
      <dd className="col-span-2 text-sm">{value || 'N/A'}</dd>
    </div>
  )
}

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
