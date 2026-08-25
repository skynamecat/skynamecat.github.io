import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { blindboxApi } from "./api";
import { AppShell } from "./components/AppShell";
import { useAdminRouter } from "./router";
import type { AnimationQa, Asset, Release, Series } from "./types";

const StudioView = lazy(() => import("./views/StudioView").then((module) => ({ default: module.StudioView })));
const OverviewView = lazy(() => import("./views/OverviewView").then((module) => ({ default: module.OverviewView })));
const DialogueView = lazy(() => import("./views/DialogueView").then((module) => ({ default: module.DialogueView })));
const UnmatchedView = lazy(() => import("./views/UnmatchedView").then((module) => ({ default: module.UnmatchedView })));
const RequestsView = lazy(() => import("./views/RequestsView").then((module) => ({ default: module.RequestsView })));
const ModelsView = lazy(() => import("./views/ModelsView").then((module) => ({ default: module.ModelsView })));
const AssetsView = lazy(() => import("./views/AssetsView").then((module) => ({ default: module.AssetsView })));
const MotionsView = lazy(() => import("./views/MotionsView").then((module) => ({ default: module.MotionsView })));
const ReleasesView = lazy(() => import("./views/ReleasesView").then((module) => ({ default: module.ReleasesView })));

export default function App() {
  const { route, navigate } = useAdminRouter();
  const [series, setSeries] = useState<Series[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [motions, setMotions] = useState<AnimationQa[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [status, setStatus] = useState("正在同步制作数据…");
  const [busy, setBusy] = useState(true);

  const report = useCallback((message: string, nextBusy = false) => { setStatus(message); setBusy(nextBusy); }, []);
  const reload = useCallback(async () => {
    const [seriesData, assetData, motionData, releaseData] = await Promise.all([
      blindboxApi.listSeries(), blindboxApi.listAssets(), blindboxApi.listMotions(), blindboxApi.listReleases()
    ]);
    setSeries(seriesData); setAssets(assetData); setMotions(motionData); setReleases(releaseData);
  }, []);

  useEffect(() => {
    let active = true;
    reload().then(() => { if (active) report("已与后台同步"); }).catch((error) => { if (active) report(error instanceof Error ? error.message : "后台连接失败"); });
    return () => { active = false; };
  }, [reload, report]);

  return <AppShell route={route} onNavigate={navigate} status={status} busy={busy}>
    <Suspense fallback={<div className="route-loading">正在准备工作台…</div>}>
      {route === "overview" && <OverviewView report={report} />}
      {route === "intents" && <DialogueView report={report} />}
      {route === "unmatched" && <UnmatchedView report={report} />}
      {route === "requests" && <RequestsView report={report} />}
      {route === "studio" && <StudioView series={series} assets={assets} motions={motions} reload={reload} report={report} />}
      {route === "models" && <ModelsView assets={assets} reload={reload} report={report} />}
      {route === "assets" && <AssetsView assets={assets} reload={reload} report={report} />}
      {route === "motions" && <MotionsView motions={motions} reload={reload} report={report} />}
      {route === "releases" && <ReleasesView releases={releases} series={series} reload={reload} report={report} />}
    </Suspense>
  </AppShell>;
}
