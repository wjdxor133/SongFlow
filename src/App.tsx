import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { AlbumDetail } from "./pages/AlbumDetail";
import { TrackDetail } from "./pages/TrackDetail";
import { Settings } from "./pages/Settings";
import { GuidedSample } from "./pages/GuidedSample";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="albums/:albumId" element={<AlbumDetail />} />
          <Route path="albums/:albumId/tracks/:trackId" element={<TrackDetail />} />
          <Route path="settings" element={<Settings />} />
          <Route path="guided" element={<GuidedSample />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
