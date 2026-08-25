import { useEffect, useState } from "react";
import type { RouteKey } from "./types";

const routePath: Record<RouteKey, string> = {
  overview: "/manage-app/",
  intents: "/manage-app/intents",
  unmatched: "/manage-app/unmatched",
  requests: "/manage-app/requests",
  studio: "/manage-app/blindbox",
  models: "/manage-app/models",
  assets: "/manage-app/assets",
  motions: "/manage-app/motions",
  releases: "/manage-app/releases"
};

function readRoute(): RouteKey {
  const path = window.location.pathname.replace(/\/+$/, "");
  if (path.endsWith("/intents")) return "intents";
  if (path.endsWith("/unmatched")) return "unmatched";
  if (path.endsWith("/requests")) return "requests";
  if (path.endsWith("/blindbox")) return "studio";
  if (path.endsWith("/models")) return "models";
  if (path.endsWith("/assets")) return "assets";
  if (path.endsWith("/motions")) return "motions";
  if (path.endsWith("/releases")) return "releases";
  return "overview";
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
