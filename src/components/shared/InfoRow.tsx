export function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b py-2 last:border-b-0">
      <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
      <dd className="col-span-2 text-sm">{value || 'N/A'}</dd>
    </div>
  )
}
