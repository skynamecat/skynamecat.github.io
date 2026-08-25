import { useEffect, useState } from "react";
import { dialogueApi } from "../api";
import { EmptyState } from "../components/EmptyState";
import type { DialogueOverview } from "../types";

export function OverviewView({ report }: { report: (message: string, busy?: boolean) => void }) {
  const [data, setData] = useState<DialogueOverview | null>(null);
  useEffect(() => { let active = true; dialogueApi.overview().then((value) => { if (active) setData(value); }).catch((error) => report(error instanceof Error ? error.message : "概览加载失败")); return () => { active = false; }; }, [report]);
  return <>
    <header className="topbar"><div><p>UNIFIED OVERVIEW</p><h1>一个入口，管理庞菠菠的全部能力。</h1></div></header>
    {!data ? <div className="route-loading">正在汇总后台数据…</div> : <>
      <section className="unified-metrics">
        <article><span>意图</span><b>{data.intentCount}</b><small>对话识别单元</small></article>
        <article><span>触发规则</span><b>{data.triggerCount}</b><small>匹配入口</small></article>
        <article><span>预制回答</span><b>{data.replyCount}</b><small>可选回应</small></article>
        <article className={data.unresolvedCount ? "attention" : ""}><span>待补问题</span><b>{data.unresolvedCount}</b><small>尚未覆盖</small></article>
      </section>
      <section className="panel overview-unmatched"><div className="panel-heading"><div><span>最近未命中</span><h2>用户正在问什么？</h2></div></div>
        {!data.recentUnmatched.length ? <EmptyState title="暂时没有待处理问题" detail="新的未命中问题会自动出现在这里。" /> : <div>{data.recentUnmatched.map((item) => <article key={item.id}><span>{item.occurrences} 次</span><p>{item.content}</p><time>{formatDate(item.lastSeenAt)}</time></article>)}</div>}
      </section>
    </>}
  </>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
