import { PodsTable } from '@/components/k8s/PodsTable'

export default function PodsPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Pods</h1>
      <div className="rounded-lg border">
        <PodsTable />
      </div>
    </div>
  )
}
