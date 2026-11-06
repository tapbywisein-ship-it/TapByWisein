import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// In dev mode, proactively unregister any stale ServiceWorker left behind
// by previous production/PWA builds so it cannot intercept fetch calls or serve stale HTML.
if (import.meta.env.DEV && typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const r of registrations) {
      r.unregister();
    }
  });
}

// Load Microsoft Clarity asynchronously so adblockers or network blocks
// NEVER prevent React from mounting and rendering the application.
import("@microsoft/clarity")
  .then((clarity) => {
    clarity.default?.init("xen9f4xfx0");
  })
  .catch((err) => {
    console.warn("Clarity analytics blocked or unavailable:", err);
  });

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
