import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold tracking-tight">SongFlow</h1>
        <p className="text-muted-foreground text-sm">
          AI-assisted music production workspace
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-full px-4 py-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Tauri + React + TypeScript + Vite
      </div>

      <Button variant="outline">Get Started</Button>
    </div>
  );
}

export default App;
