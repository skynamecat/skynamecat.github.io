"use client";

import { useEffect, useState } from "react";

type DisplayMode = "standard" | "minimal";

const storageKey = "sky-display-mode";
const changeEvent = "sky-display-mode-change";

function readDisplayMode(): DisplayMode {
  return document.documentElement.dataset.displayMode === "minimal" ? "minimal" : "standard";
}

export function DisplayModeControl() {
  const [mode, setMode] = useState<DisplayMode>("minimal");

  useEffect(() => {
    setMode(readDisplayMode());
  }, []);

  function toggleMode() {
    const next: DisplayMode = mode === "minimal" ? "standard" : "minimal";
    document.documentElement.dataset.displayMode = next;
    localStorage.setItem(storageKey, next);
    setMode(next);
    window.dispatchEvent(new CustomEvent(changeEvent, { detail: next }));
  }

  const isMinimal = mode === "minimal";

  return (
    <button
      className="display-mode-control"
      type="button"
      onClick={toggleMode}
      aria-pressed={isMinimal}
      aria-label={isMinimal ? "退出极简模式" : "进入极简模式"}
      title={isMinimal ? "恢复完整模式" : "切换到极简模式"}
    >
      <span className="display-mode-icon" aria-hidden="true"><i /><i /></span>
      <span>{isMinimal ? "标准" : "极简"}</span>
    </button>
  );
}
