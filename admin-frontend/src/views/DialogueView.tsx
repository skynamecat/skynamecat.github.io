import { useCallback, useEffect, useMemo, useState } from "react";
import { dialogueApi } from "../api";
import { ConfirmButton } from "../components/ConfirmButton";
import { EmptyState } from "../components/EmptyState";
import type { DialogueIntent, DialogueReply, DialogueTrigger, MatchType } from "../types";

type Reporter = (message: string, busy?: boolean) => void;

export function DialogueView({ report }: { report: Reporter }) {
  const [items, setItems] = useState<DialogueIntent[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
  const load = useCallback(async () => setItems(await dialogueApi.listIntents()), []);
  useEffect(() => { load().catch((error) => report(error instanceof Error ? error.message : "意图加载失败")); }, [load, report]);
  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);

  async function removeIntent(intent: DialogueIntent) {
    report(`正在删除意图 ${intent.name}…`, true);
    try { await dialogueApi.deleteIntent(intent.id); setSelectedId(null); await load(); report("意图已删除"); }
    catch (error) { report(error instanceof Error ? error.message : "删除失败"); }
  }

  return <>
    <header className="topbar"><div><p>DIALOGUE LIBRARY</p><h1>让庞菠菠知道什么，<br />以及该怎样回答。</h1></div><button className="primary" type="button" onClick={() => setSelectedId("new")}>新建意图</button></header>
    <section className="dialogue-layout">
      <aside className="panel intent-index"><header><span>意图清单</span><strong>{items.length.toString().padStart(2, "0")}</strong></header>{!items.length ? <p>还没有意图。</p> : items.map((intent) => <button type="button" key={intent.id} className={selectedId === intent.id ? "selected" : ""} onClick={() => setSelectedId(intent.id)}><i className={intent.enabled ? "enabled" : ""} /><span><b>{intent.name}</b><small>{intent.code}</small></span><em>{intent.triggers.length} / {intent.replies.length}</em></button>)}</aside>
      <main className="dialogue-workbench">
        {selectedId === "new" ? <IntentEditor report={report} onSaved={async () => { await load(); setSelectedId(null); }} /> : selected ? <>
          <IntentEditor key={`${selected.id}:${selected.updatedAt}`} intent={selected} report={report} onSaved={load} onDelete={() => void removeIntent(selected)} />
          <RulesPanel intent={selected} report={report} reload={load} />
          <RepliesPanel intent={selected} report={report} reload={load} />
        </> : <EmptyState title="选择一个意图开始维护" detail="左侧是全部对话意图；你也可以直接创建一个新的意图。" />}
      </main>
    </section>
  </>;
}

function IntentEditor({ intent, report, onSaved, onDelete }: { intent?: DialogueIntent; report: Reporter; onSaved: () => Promise<void>; onDelete?: () => void }) {
  const [value, setValue] = useState({ code: intent?.code ?? "", name: intent?.name ?? "", description: intent?.description ?? "", priority: intent?.priority ?? 0, enabled: intent?.enabled ?? true });
  async function save() { report("正在保存意图…", true); try { if (intent) await dialogueApi.updateIntent(intent.id, value); else await dialogueApi.createIntent(value); await onSaved(); report("意图已保存"); } catch (error) { report(error instanceof Error ? error.message : "保存失败"); } }
  return <section className="panel intent-editor"><div className="panel-heading"><div><span>{intent ? "意图设置" : "新建意图"}</span><h2>{intent?.name ?? "定义新的对话意图"}</h2></div>{intent && <label className="toggle"><input type="checkbox" checked={value.enabled} onChange={(event) => setValue({ ...value, enabled: event.target.checked })} /><i /><span>启用</span></label>}</div><div className="intent-form"><label><span>意图代码</span><input disabled={Boolean(intent)} required value={value.code} onChange={(event) => setValue({ ...value, code: event.target.value })} placeholder="例如 about_me" /></label><label><span>显示名称</span><input required value={value.name} onChange={(event) => setValue({ ...value, name: event.target.value })} /></label><label><span>优先级</span><input type="number" value={value.priority} onChange={(event) => setValue({ ...value, priority: Number(event.target.value) })} /></label><label className="wide"><span>说明</span><textarea rows={2} value={value.description} onChange={(event) => setValue({ ...value, description: event.target.value })} /></label></div><footer><button className="primary" type="button" onClick={() => void save()}>保存意图</button>{intent && onDelete && <ConfirmButton question={`确定删除“${intent.name}”及其全部规则和回答？`} onClick={onDelete}>删除意图</ConfirmButton>}</footer></section>;
}

function RulesPanel({ intent, report, reload }: { intent: DialogueIntent; report: Reporter; reload: () => Promise<void> }) {
  const [draft, setDraft] = useState({ matchType: "CONTAINS" as MatchType, pattern: "", weight: 1, enabled: true });
  async function create() { report("正在添加触发规则…", true); try { await dialogueApi.createTrigger(intent.id, draft); setDraft({ ...draft, pattern: "" }); await reload(); report("触发规则已添加"); } catch (error) { report(error instanceof Error ? error.message : "添加失败"); } }
  async function toggle(item: DialogueTrigger) { try { await dialogueApi.updateTrigger(intent.id, item.id, { matchType: item.matchType, pattern: item.pattern, weight: item.weight, enabled: !item.enabled }); await reload(); report("触发规则已更新"); } catch (error) { report(error instanceof Error ? error.message : "更新失败"); } }
  async function remove(item: DialogueTrigger) { try { await dialogueApi.deleteTrigger(intent.id, item.id); await reload(); report("触发规则已删除"); } catch (error) { report(error instanceof Error ? error.message : "删除失败"); } }
  return <section className="panel dialogue-subpanel"><div className="panel-heading"><div><span>触发规则</span><h2>用户怎样说会命中？</h2></div><b>{intent.triggers.length}</b></div><div className="quick-add"><select value={draft.matchType} onChange={(event) => setDraft({ ...draft, matchType: event.target.value as MatchType })}><option value="EXACT">完全匹配</option><option value="CONTAINS">包含文本</option><option value="REGEX">正则表达式</option></select><input value={draft.pattern} onChange={(event) => setDraft({ ...draft, pattern: event.target.value })} placeholder="输入触发内容" /><input type="number" min="0.001" max="1" step="0.001" value={draft.weight} onChange={(event) => setDraft({ ...draft, weight: Number(event.target.value) })} /><button type="button" onClick={() => void create()} disabled={!draft.pattern.trim()}>添加</button></div><div className="dialogue-items">{intent.triggers.map((item) => <article key={item.id} className={!item.enabled ? "disabled" : ""}><span>{item.matchType}</span><p>{item.pattern}</p><small>{Number(item.weight).toFixed(3)}</small><button type="button" onClick={() => void toggle(item)}>{item.enabled ? "停用" : "启用"}</button><ConfirmButton question="确定删除这条触发规则？" onClick={() => void remove(item)}>删除</ConfirmButton></article>)}</div></section>;
}

function RepliesPanel({ intent, report, reload }: { intent: DialogueIntent; report: Reporter; reload: () => Promise<void> }) {
  const [content, setContent] = useState("");
  async function create() { report("正在添加回答…", true); try { await dialogueApi.createReply(intent.id, { content, weight: 1, enabled: true }); setContent(""); await reload(); report("回答已添加"); } catch (error) { report(error instanceof Error ? error.message : "添加失败"); } }
  async function toggle(item: DialogueReply) { try { await dialogueApi.updateReply(intent.id, item.id, { content: item.content, weight: item.weight, enabled: !item.enabled }); await reload(); report("回答已更新"); } catch (error) { report(error instanceof Error ? error.message : "更新失败"); } }
  async function remove(item: DialogueReply) { try { await dialogueApi.deleteReply(intent.id, item.id); await reload(); report("回答已删除"); } catch (error) { report(error instanceof Error ? error.message : "删除失败"); } }
  return <section className="panel dialogue-subpanel"><div className="panel-heading"><div><span>预制回答</span><h2>庞菠菠应该怎样回答？</h2></div><b>{intent.replies.length}</b></div><div className="reply-add"><textarea rows={3} value={content} onChange={(event) => setContent(event.target.value)} placeholder="输入一条自然、简洁的回答" /><button type="button" onClick={() => void create()} disabled={!content.trim()}>添加回答</button></div><div className="reply-cards">{intent.replies.map((item) => <article key={item.id} className={!item.enabled ? "disabled" : ""}><p>{item.content}</p><footer><span>权重 {item.weight}</span><button type="button" onClick={() => void toggle(item)}>{item.enabled ? "停用" : "启用"}</button><ConfirmButton question="确定删除这条回答？" onClick={() => void remove(item)}>删除</ConfirmButton></footer></article>)}</div></section>;
}
