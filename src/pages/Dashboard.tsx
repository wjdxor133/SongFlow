export function Dashboard() {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your projects will appear here.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No projects yet
          </p>
          <p className="text-xs text-muted-foreground">
            Project management will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
