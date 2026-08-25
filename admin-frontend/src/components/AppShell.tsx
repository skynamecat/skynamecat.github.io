import type { ReactNode } from "react";
import type { RouteKey } from "../types";

const nav: { key: RouteKey; index: string; label: string; hint: string }[] = [
  { key: "studio", index: "01", label: "盲盒工作台", hint: "系列与概率" },
  { key: "assets", index: "02", label: "素材库", hint: "模型与贴图" },
  { key: "motions", index: "03", label: "动作质检", hint: "预览与验收" },
  { key: "releases", index: "04", label: "发布记录", hint: "版本与回滚" }
];

type Props = {
  route: RouteKey;
  onNavigate: (route: RouteKey) => void;
  status: string;
  busy?: boolean;
  children: ReactNode;
};

export function AppShell({ route, onNavigate, status, busy, children }: Props) {
  return <div className="admin-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate("studio")}><span>庞</span><div><strong>庞菠菠</strong><small>BLINDBOX STUDIO</small></div></button>
      <nav aria-label="管理模块">
        {nav.map((item) => <button key={item.key} className={route === item.key ? "active" : ""} onClick={() => onNavigate(item.key)} aria-current={route === item.key ? "page" : undefined}>
          <i>{item.index}</i><span><b>{item.label}</b><small>{item.hint}</small></span>
        </button>)}
      </nav>
      <div className="sidebar-note"><b>制作基线</b><span>skeleton-v1 · schema-v1</span><small>每次发布保存完整快照，线上版本可安全回退。</small></div>
    </aside>
    <main>
      <div className={`global-status ${busy ? "busy" : ""}`} role="status"><i />{status}</div>
      {children}
    </main>
  </div>;
}
