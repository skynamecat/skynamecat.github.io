"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const PangboboPet = dynamic(
  () => import("./pangbobo-pet").then((module) => module.PangboboPet),
  { ssr: false },
);

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
};

export function PangboboLoader() {
  const [ready, setReady] = useState(false);
  const [minimal, setMinimal] = useState(true);

  useEffect(() => {
    const syncMode = () => setMinimal(document.documentElement.dataset.displayMode === "minimal");
    syncMode();
    window.addEventListener("sky-display-mode-change", syncMode);
    return () => window.removeEventListener("sky-display-mode-change", syncMode);
  }, []);

  useEffect(() => {
    if (minimal) {
      setReady(false);
      return;
    }
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const needsMoreTime = connection?.saveData
      || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "");
    const timeout = needsMoreTime ? 2400 : 900;

    const requestIdle = window.requestIdleCallback?.bind(window);
    if (requestIdle) {
      const idleId = requestIdle(() => setReady(true), { timeout });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = globalThis.setTimeout(() => setReady(true), needsMoreTime ? 1400 : 350);
    return () => globalThis.clearTimeout(timer);
  }, [minimal]);

  return ready && !minimal ? <PangboboPet /> : null;
}
