import { ServicesTable } from '@/components/k8s/ServicesTable'

export default function ServicesPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Services</h1>
      <div className="rounded-lg border">
        <ServicesTable />
      </div>
    </div>
  )
}
