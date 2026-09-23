"use client";

import { useEffect } from "react";

export function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          return Promise.all(
            registrations.map((registration) => registration.unregister())
          );
        })
        .catch(() => {});

      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
