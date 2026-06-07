function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold tracking-tight">SongFlow</h1>
        <p className="text-gray-400 text-sm">
          AI-assisted music production workspace
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 border border-gray-800 rounded-full px-4 py-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Tauri + React + TypeScript + Vite
      </div>
    </div>
  );
}

export default App;
