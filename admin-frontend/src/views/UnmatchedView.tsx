import { useCallback, useEffect, useMemo, useState } from "react";
import { dialogueApi } from "../api";
import { EmptyState } from "../components/EmptyState";
import type { UnmatchedUtterance } from "../types";

export function UnmatchedView({ report }: { report: (message: string, busy?: boolean) => void }) {
  const [items, setItems] = useState<UnmatchedUtterance[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const load = useCallback(async () => setItems(await dialogueApi.listUnmatched()), []);
  useEffect(() => { load().catch((error) => report(error instanceof Error ? error.message : "未命中问题加载失败")); }, [load, report]);
  const visible = useMemo(() => items.filter((item) => showResolved || !item.resolved), [items, showResolved]);
  async function toggle(item: UnmatchedUtterance) { report("正在更新问题状态…", true); try { await dialogueApi.resolveUnmatched(item.id, !item.resolved); await load(); report(item.resolved ? "问题已重新打开" : "问题已完成"); } catch (error) { report(error instanceof Error ? error.message : "更新失败"); } }
  return <>
    <header className="topbar"><div><p>CONTENT GAPS</p><h1>把没有回答好的问题，<br />变成下一条知识。</h1></div><label className="resolved-switch"><input type="checkbox" checked={showResolved} onChange={(event) => setShowResolved(event.target.checked)} />显示已处理</label></header>
    {!visible.length ? <EmptyState title="这里已经清空" detail="当前没有需要处理的未命中问题。" /> : <section className="panel unmatched-table"><header><span>问题</span><span>出现次数</span><span>最后出现</span><span>状态</span></header>{visible.map((item) => <article key={item.id} className={item.resolved ? "resolved" : ""}><p>{item.content}</p><b>{item.occurrences}</b><time>{formatDate(item.lastSeenAt)}</time><button type="button" onClick={() => void toggle(item)}>{item.resolved ? "重新打开" : "标记完成"}</button></article>)}</section>}
  </>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
