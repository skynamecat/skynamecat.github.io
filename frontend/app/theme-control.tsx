"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Theme = "light" | "dark";

export function ThemeControl() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [transition, setTransition] = useState<Theme | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("sky-theme") as Theme | null;
    const next = saved ?? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.dataset.theme = next;
    setTheme(next);
    return () => {
      timers.current.forEach(clearTimeout);
      document.documentElement.classList.remove("theme-switching");
    };
  }, []);

  function toggleTheme() {
    if (transition) return;
    const next = theme === "dark" ? "light" : "dark";
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      document.documentElement.dataset.theme = next;
      localStorage.setItem("sky-theme", next);
      setTheme(next);
      return;
    }

    document.documentElement.classList.add("theme-switching");
    setTransition(next);
    timers.current.push(setTimeout(() => {
      document.documentElement.dataset.theme = next;
      localStorage.setItem("sky-theme", next);
      setTheme(next);
    }, 980));
    timers.current.push(setTimeout(() => {
      setTransition(null);
      document.documentElement.classList.remove("theme-switching");
    }, 1550));
  }

  return (
    <>
      <button
        className="theme-control"
        type="button"
        onClick={toggleTheme}
        disabled={Boolean(transition)}
        aria-label={theme === "dark" ? "太阳升起，切换到白天模式" : "太阳落下，切换到夜间模式"}
        title={theme === "dark" ? "迎来白天" : "进入夜晚"}
      >
        <span className="celestial-button" aria-hidden="true">
          <i className="celestial-core" />
          <i className="celestial-ray ray-one" />
          <i className="celestial-ray ray-two" />
        </span>
      </button>
      {transition && createPortal(
        <div className={`solar-transition to-${transition}`} aria-hidden="true">
          <i className="transition-sun" />
          <i className="transition-moon" />
          <i className="transition-horizon" />
        </div>,
        document.body,
      )}
    </>
  );
}
