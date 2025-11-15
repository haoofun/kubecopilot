interface ResourcePlaceholderProps {
  label: string
  description?: string
}

export function ResourcePlaceholder({
  label,
  description = 'Explorer coming soon.',
}: ResourcePlaceholderProps) {
  return (
    <div className="bg-muted/30 text-muted-foreground rounded-xl border p-10 text-center shadow-sm">
      <div className="text-2xl">🚧</div>
      <p className="mt-2 text-lg font-semibold">{label}</p>
      <p className="text-sm">{description}</p>
    </div>
  )
}
