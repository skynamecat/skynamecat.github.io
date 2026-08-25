import { useMemo, useState } from "react";
import { blindboxApi } from "../api";
import { ConfirmButton } from "../components/ConfirmButton";
import { EmptyState } from "../components/EmptyState";
import type { Release, Series } from "../types";

type Props = { releases: Release[]; series: Series[]; reload: () => Promise<void>; report: (message: string, busy?: boolean) => void };
const statusName = { PUBLISHED: "当前/已发布", ROLLED_BACK: "已回滚", SUPERSEDED: "历史版本" } as const;

export function ReleasesView({ releases, series, reload, report }: Props) {
  const [seriesId, setSeriesId] = useState<number | "ALL">("ALL");
  const visible = useMemo(() => seriesId === "ALL" ? releases : releases.filter((item) => item.seriesId === seriesId), [releases, seriesId]);

  async function rollback(release: Release) {
    report(`正在回滚到 v${release.version}…`, true);
    try { await blindboxApi.rollback(release.id); await reload(); report(`${release.seriesName} 已回滚到 v${release.version}`); }
    catch (error) { report(error instanceof Error ? error.message : "回滚失败"); }
  }

  return <>
    <header className="topbar"><div><p>RELEASE LEDGER</p><h1>每一次发布，都留有回去的路。</h1></div><label className="header-filter"><span>筛选系列</span><select value={seriesId} onChange={(e) => setSeriesId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}><option value="ALL">全部系列</option>{series.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></header>
    {!visible.length ? <EmptyState title="还没有发布记录" detail="从盲盒工作台发布系列后，会在这里生成不可变版本快照。" /> : <section className="release-ledger">{visible.map((release, index) => <article className="release-entry" key={release.id}>
      <div className="timeline-mark"><span>{String(visible.length - index).padStart(2, "0")}</span><i /></div>
      <div className="panel release-card">
        <header><div><span>{release.seriesName}</span><h2>版本 v{release.version}</h2></div><span className={`release-state ${release.status.toLowerCase()}`}>{statusName[release.status]}</span></header>
        <div className="release-meta"><span><small>发布者</small><b>{release.publishedBy}</b></span><span><small>款式</small><b>{release.variantCount} 款</b></span><span><small>发布时间</small><b>{formatDate(release.publishedAt)}</b></span></div>
        <p>{release.note || "本次发布没有填写说明。"}</p>
        <footer><code>snapshot:{release.id}</code><ConfirmButton disabled={release.status === "PUBLISHED"} question={`确定把“${release.seriesName}”回滚到 v${release.version}？系统会生成一个新的发布版本。`} onClick={() => void rollback(release)}>回滚到此版本</ConfirmButton></footer>
      </div>
    </article>)}</section>}
  </>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
