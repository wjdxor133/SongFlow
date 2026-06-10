import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAlbumStore } from "../store/useAlbumStore";

export function AppShell() {
  const startPolling = useAlbumStore((s) => s.startPolling);
  const stopPolling = useAlbumStore((s) => s.stopPolling);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
