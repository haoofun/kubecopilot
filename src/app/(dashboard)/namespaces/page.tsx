import { NamespaceTable } from '@/components/k8s/NamespaceTable'

export default function NamespacesPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Namespaces</h1>
      <div className="rounded-lg border">
        <NamespaceTable />
      </div>
    </div>
  )
}
