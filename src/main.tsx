import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// DEV-only structural validation of the baked guided sample. Tree-shaken out of
// production builds; never runs or throws for end users.
if (import.meta.env.DEV) {
  import("./lib/onboarding/sampleTrack.assert").then((m) => m.assertGuidedSample());
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
