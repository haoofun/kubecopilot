import { DeploymentsTable } from '@/components/k8s/DeploymentsTable'

export default function DeploymentsPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Deployments</h1>
      <div className="rounded-lg border">
        <DeploymentsTable />
      </div>
    </div>
  )
}
