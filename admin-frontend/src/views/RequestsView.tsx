import { useEffect, useState } from "react";
import { dialogueApi } from "../api";
import { EmptyState } from "../components/EmptyState";
import type { RequestDetail, RequestLog } from "../types";

export function RequestsView({ report }: { report: (message: string, busy?: boolean) => void }) {
  const [items, setItems] = useState<RequestLog[]>([]);
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  useEffect(() => { let active = true; dialogueApi.listRequests().then((value) => { if (active) setItems(value); }).catch((error) => report(error instanceof Error ? error.message : "请求记录加载失败")); return () => { active = false; }; }, [report]);
  async function inspect(item: RequestLog) { report("正在读取请求链路…", true); try { setDetail(await dialogueApi.requestDetail(item.id)); report("请求链路已载入"); } catch (error) { report(error instanceof Error ? error.message : "请求详情加载失败"); } }
  return <>
    <header className="topbar"><div><p>REQUEST TRACE</p><h1>每一次操作，<br />都留下可以解释的链路。</h1></div><div className="asset-counter"><b>{items.length}</b><span>最近请求</span></div></header>
    {!items.length ? <EmptyState title="还没有请求记录" detail="用户访问和 API 操作会记录在这里。" /> : <section className="panel request-ledger"><header><span>时间</span><span>方法与路径</span><span>状态</span><span>耗时</span><span>来源</span><span /></header>{items.map((item) => <article key={item.id}><time>{formatDate(item.createdAt)}</time><p><i>{item.method}</i>{item.path}</p><b className={item.statusCode >= 400 ? "bad" : ""}>{item.statusCode}</b><span>{item.durationMs} ms</span><span>{item.actor || item.clientIp || "匿名"}</span><button type="button" onClick={() => void inspect(item)}>详情</button></article>)}</section>}
    {detail && <div className="drawer-backdrop"><button className="drawer-dismiss" type="button" aria-label="关闭请求详情" onClick={() => setDetail(null)} /><aside className="editor-drawer request-detail"><header><div><small>REQUEST DETAIL</small><h2>{detail.request.method} {detail.request.path}</h2></div><button type="button" onClick={() => setDetail(null)}>×</button></header><dl><div><dt>请求 ID</dt><dd>{detail.request.id}</dd></div><div><dt>状态 / 耗时</dt><dd>{detail.request.statusCode} · {detail.request.durationMs} ms</dd></div><div><dt>来源</dt><dd>{detail.request.actor || detail.request.clientIp || "匿名"}</dd></div><div><dt>会话</dt><dd>{detail.request.sessionId || "—"}</dd></div></dl><section><h3>对话消息</h3>{!detail.messages.length ? <p>该请求没有关联对话消息。</p> : detail.messages.map((message) => <article key={message.id} className={message.role.toLowerCase()}><span>{message.role === "USER" ? "用户" : "庞菠菠"}</span><p>{message.content}</p><small>{message.intentCode || message.provider || "—"}</small></article>)}</section></aside></div>}
  </>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value)); }
