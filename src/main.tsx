import { createRoot } from "react-dom/client";
import { RootErrorBoundary } from "./components/error-boundaries/RootErrorBoundary";
import { initMonitoring } from "./lib/monitoring";
import App from "./App.tsx";
import "./index.css";

// Initialize monitoring (Sentry + PostHog) - non-blocking
initMonitoring();

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
