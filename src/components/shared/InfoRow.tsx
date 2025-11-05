'use client'

export function InfoRow({
  label,
  value,
  helper,
}: {
  label: string
  value: React.ReactNode
  helper?: React.ReactNode
}) {
  return (
    <div className="grid w-full min-w-0 gap-2 border-b py-3 last:border-b-0 sm:grid-cols-[180px_1fr]">
      <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
      <dd className="w-full max-w-full min-w-0 text-sm leading-6 break-words break-all">
        {value ?? '—'}
        {helper ? (
          <div className="text-muted-foreground pt-1 text-xs">{helper}</div>
        ) : null}
      </dd>
    </div>
  )
}
