export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Cluster Overview</h1>
        <p className="text-muted-foreground">
          Welcome to your KubeCopilot dashboard. Use the global search in the
          header to jump directly to workloads, networking, and cluster
          resources.
        </p>
      </header>
    </div>
  )
}
