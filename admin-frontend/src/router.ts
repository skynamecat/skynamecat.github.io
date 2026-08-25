import { useEffect, useState } from "react";
import type { RouteKey } from "./types";

const routePath: Record<RouteKey, string> = {
  studio: "/manage-app/",
  assets: "/manage-app/assets",
  motions: "/manage-app/motions",
  releases: "/manage-app/releases"
};

function readRoute(): RouteKey {
  const path = window.location.pathname.replace(/\/+$/, "");
  if (path.endsWith("/assets")) return "assets";
  if (path.endsWith("/motions")) return "motions";
  if (path.endsWith("/releases")) return "releases";
  return "studio";
}

export function useAdminRouter() {
  const [route, setRoute] = useState<RouteKey>(readRoute);
  useEffect(() => {
    const onPopState = () => setRoute(readRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(next: RouteKey) {
    if (next === route) return;
    window.history.pushState({}, "", routePath[next]);
    setRoute(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return { route, navigate };
}
