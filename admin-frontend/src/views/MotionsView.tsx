import { useEffect, useState } from "react";
import { blindboxApi } from "../api";
import { EmptyState } from "../components/EmptyState";
import { ModelStage } from "../ModelStage";
import type { AnimationQa, QaStatus } from "../types";

type Props = { motions: AnimationQa[]; reload: () => Promise<void>; report: (message: string, busy?: boolean) => void };
const qaName: Record<QaStatus, string> = { PENDING: "待质检", REVIEWING: "质检中", PASSED: "已通过", REJECTED: "需返工" };

export function MotionsView({ motions, reload, report }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(motions[0]?.id ?? null);
  const selected = motions.find((item) => item.id === selectedId) ?? motions[0];
  const [status, setStatus] = useState<QaStatus>(selected?.qaStatus ?? "PENDING");
  const [notes, setNotes] = useState(selected?.notes ?? "");
  useEffect(() => { if (selected) { setStatus(selected.qaStatus); setNotes(selected.notes ?? ""); } }, [selected]);

  async function save() {
    if (!selected) return;
    report("正在保存动作质检…", true);
    try { await blindboxApi.reviewMotion(selected.id, status, notes); await reload(); report(`${selected.displayName} 的质检结果已保存`); }
    catch (error) { report(error instanceof Error ? error.message : "保存失败"); }
  }

  return <>
    <header className="topbar"><div><p>MOTION QA BENCH</p><h1>动作不是动起来，是站得住。</h1></div><div className="qa-summary"><b>{motions.filter((item) => item.qaStatus === "PASSED").length}/{motions.length}</b><span>动作通过</span></div></header>
    {!motions.length ? <EmptyState title="还没有动作片段" detail="上传包含动画的 GLB 后，由后台登记可质检的动作片段。" /> : <section className="motion-layout">
      <aside className="panel motion-list"><div className="panel-heading"><div><span>动作片段</span><h2>检查队列</h2></div></div>{motions.map((motion) => <button className={selected?.id === motion.id ? "selected" : ""} key={motion.id} onClick={() => setSelectedId(motion.id)}><span><b>{motion.displayName}</b><small>{motion.name} · {motion.duration.toFixed(2)}s</small></span><i className={`qa-chip ${motion.qaStatus.toLowerCase()}`}>{qaName[motion.qaStatus]}</i></button>)}</aside>
      <section className="panel motion-stage-panel"><div className="panel-heading"><div><span>实时预览</span><h2>{selected?.displayName}</h2></div><span className="stage-hint">拖动旋转 · 滚轮缩放</span></div>{selected && <ModelStage clipName={selected.name} modelUrl={selected.modelUrl} />}
        <div className="qa-checklist"><span>检查提示</span><ol><li><b>01</b>足底有没有滑动或穿地</li><li><b>02</b>头、髋与胸腔的重心是否连续</li><li><b>03</b>循环首尾有没有弹跳或停顿</li></ol></div>
      </section>
      <aside className="panel review-panel"><div className="panel-heading"><div><span>验收记录</span><h2>QA 结论</h2></div></div>
        <label><span>状态</span><select value={status} onChange={(e) => setStatus(e.target.value as QaStatus)}>{Object.entries(qaName).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label><span>检查备注</span><textarea rows={10} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="记录脚滑、穿模、重心或循环问题…" /></label>
        <button className="primary" onClick={() => void save()}>保存质检结果</button>
        <p>最后更新<br /><b>{selected ? formatDate(selected.updatedAt) : "—"}</b></p>
      </aside>
    </section>}
  </>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
