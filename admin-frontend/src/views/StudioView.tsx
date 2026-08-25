import { useEffect, useMemo, useState } from "react";
import { blindboxApi } from "../api";
import { ConfirmButton } from "../components/ConfirmButton";
import { EmptyState } from "../components/EmptyState";
import { ProbabilitySimulator } from "../components/ProbabilitySimulator";
import { SeriesForm } from "../components/SeriesForm";
import { VariantForm } from "../components/VariantForm";
import { ModelStage } from "../ModelStage";
import type { AnimationQa, Asset, Series, SeriesInput, Variant, VariantInput } from "../types";

const rarityName = { COMMON: "常规", UNCOMMON: "特别", RARE: "稀有", EPIC: "隐藏" } as const;
type Editor = { type: "series"; series?: Series } | { type: "variant"; variant?: Variant } | null;

type Props = {
  series: Series[];
  motions: AnimationQa[];
  assets: Asset[];
  reload: () => Promise<void>;
  report: (message: string, busy?: boolean) => void;
};

export function StudioView({ series, motions, assets, reload, report }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(series[0]?.id ?? null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [releaseNote, setReleaseNote] = useState("");
  const active = series.find((item) => item.id === selectedId) ?? series[0];
  const selectedVariant = active?.variants.find((item) => item.id === selectedVariantId) ?? active?.variants[0];
  const totalWeight = useMemo(() => active?.variants.filter((item) => item.enabled).reduce((sum, item) => sum + item.weight, 0) ?? 0, [active]);
  const selectedMotion = motions.find((item) => item.name === selectedVariant?.animationClip);

  useEffect(() => {
    if (series.length && !series.some((item) => item.id === selectedId)) setSelectedId(series[0].id);
  }, [series, selectedId]);

  async function mutation(label: string, task: () => Promise<unknown>) {
    report(`${label}…`, true);
    try { await task(); await reload(); report(`${label}完成`); setEditor(null); }
    catch (error) { report(error instanceof Error ? error.message : `${label}失败`); }
  }

  async function saveSeries(input: SeriesInput) {
    if (editor?.type === "series" && editor.series) await mutation("保存系列", () => blindboxApi.updateSeries(editor.series!.id, input));
    else await mutation("创建系列", async () => { const created = await blindboxApi.createSeries(input); setSelectedId(created.id); });
  }
  async function saveVariant(input: VariantInput) {
    if (!active) return;
    if (editor?.type === "variant" && editor.variant) await mutation("保存款式", () => blindboxApi.updateVariant(active.id, editor.variant!.id, input));
    else await mutation("添加款式", () => blindboxApi.createVariant(active.id, input));
  }
  async function publish() {
    if (!active) return;
    await mutation("发布新版本", () => blindboxApi.publish(active.id, releaseNote));
    setReleaseNote("");
  }

  return <>
    <header className="topbar">
      <div><p>BLINDBOX CONTROL ROOM</p><h1>把惊喜，调到刚刚好。</h1></div>
      <button className="primary strong-action" onClick={() => setEditor({ type: "series" })}>＋ 新建系列</button>
    </header>

    {!series.length ? <EmptyState title="还没有盲盒系列" detail="创建第一个系列，再添加款式与抽取权重。" action={<button className="primary" onClick={() => setEditor({ type: "series" })}>创建系列</button>} /> : <>
      <section className="studio-grid">
        <aside className="panel series-index">
          <div className="panel-heading"><div><span>系列</span><h2>制作队列</h2></div><b>{series.length}</b></div>
          <div className="series-list">{series.map((item) => <button key={item.id} className={item.id === active?.id ? "selected" : ""} onClick={() => { setSelectedId(item.id); setSelectedVariantId(null); }}>
            <i style={{ background: themeColor(item.theme) }} /><span><b>{item.name}</b><small>{item.code} · {item.variants.length} 款</small></span><em>{item.publishedVersion ? `v${item.publishedVersion}` : "草稿"}</em>
          </button>)}</div>
        </aside>

        <section className="panel variant-workbench">
          <div className="panel-heading">
            <div><span>款式与权重</span><h2>{active?.name}</h2><p>{active?.description || "尚未填写系列说明"}</p></div>
            <div className="heading-actions"><button onClick={() => setEditor({ type: "series", series: active })}>编辑系列</button><button className="primary" onClick={() => setEditor({ type: "variant" })}>＋ 添加款式</button></div>
          </div>
          <div className="metrics"><article><small>参与抽取</small><strong>{active?.variants.filter((item) => item.enabled).length}</strong></article><article><small>总权重</small><strong>{totalWeight.toFixed(2)}</strong></article><article><small>线上版本</small><strong>{active?.publishedVersion ? `v${active.publishedVersion}` : "—"}</strong></article></div>
          {!active?.variants.length ? <div className="inline-empty">这个系列还没有款式。</div> : <div className="variant-table">
            <div className="variant-table-head"><span>款式</span><span>动作</span><span>权重 / 概率</span><span>状态</span><span /></div>
            {active.variants.map((variant) => {
              const chance = variant.enabled && totalWeight ? variant.weight / totalWeight * 100 : 0;
              return <div className={`variant-row ${selectedVariant?.id === variant.id ? "selected" : ""}`} key={variant.id} onClick={() => setSelectedVariantId(variant.id)}>
                <span><i className={`rarity-dot ${variant.rarity.toLowerCase()}`} /><b>{variant.name}</b><small>{rarityName[variant.rarity]} · {variant.code}</small></span>
                <code>{variant.animationClip}</code>
                <span className="weight-cell"><b>{variant.weight.toFixed(3)}</b><small>{chance.toFixed(2)}%</small><i><em style={{ width: `${chance}%` }} /></i></span>
                <span className={`state-pill ${variant.enabled ? "ok" : "off"}`}>{variant.enabled ? "参与" : "停用"}</span>
                <span className="row-actions"><button onClick={(event) => { event.stopPropagation(); setEditor({ type: "variant", variant }); }}>编辑</button><ConfirmButton question={`确定删除“${variant.name}”？`} onClick={(event) => { event.stopPropagation(); void mutation("删除款式", () => blindboxApi.deleteVariant(active.id, variant.id)); }}>删除</ConfirmButton></span>
              </div>;
            })}
          </div>}
        </section>

        <section className="panel compact-preview">
          <div className="panel-heading"><div><span>当前选中</span><h2>{selectedVariant?.name ?? "未选择款式"}</h2></div>{selectedMotion && <span className={`qa-chip ${selectedMotion.qaStatus.toLowerCase()}`}>{qaText(selectedMotion.qaStatus)}</span>}</div>
          {selectedVariant ? <ModelStage clipName={selectedVariant.animationClip} modelUrl={selectedMotion?.modelUrl} /> : <div className="inline-empty">选择一个款式查看动作。</div>}
          {selectedVariant && <dl className="preview-meta"><div><dt>动作</dt><dd>{selectedVariant.animationClip}</dd></div><div><dt>稀有度</dt><dd>{rarityName[selectedVariant.rarity]}</dd></div></dl>}
        </section>
      </section>

      {active && <ProbabilitySimulator variants={active.variants} />}
      {active && <section className="panel publish-strip"><div><span>生成不可变快照</span><h2>发布 {active.name}</h2><p>当前配置会生成下一个版本；旧版本仍可在发布记录中回滚。</p></div><label><span>发布说明（可选）</span><input value={releaseNote} onChange={(event) => setReleaseNote(event.target.value)} placeholder="例如：调整隐藏款概率" /></label><button className="primary" disabled={!active.variants.some((item) => item.enabled)} onClick={() => void publish()}>发布新版本</button></section>}
    </>}

    {editor && <div className="drawer-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setEditor(null); }}><aside className="editor-drawer">
      <header><div><span>{editor.type === "series" ? "SERIES" : "VARIANT"}</span><h2>{editor.type === "series" ? editor.series ? "编辑系列" : "新建系列" : editor.variant ? "编辑款式" : "添加款式"}</h2></div><button aria-label="关闭" onClick={() => setEditor(null)}>×</button></header>
      {editor.type === "series" ? <SeriesForm series={editor.series} onSubmit={saveSeries} onCancel={() => setEditor(null)} /> : <VariantForm variant={editor.variant} motions={motions} assets={assets} onSubmit={saveVariant} onCancel={() => setEditor(null)} />}
      {editor.type === "series" && editor.series && <div className="danger-zone"><div><b>删除系列</b><small>会同时删除该系列下的草稿款式。</small></div><ConfirmButton question={`确定删除系列“${editor.series.name}”？`} onClick={() => void mutation("删除系列", () => blindboxApi.deleteSeries(editor.series!.id))}>删除</ConfirmButton></div>}
    </aside></div>}
  </>;
}

function themeColor(theme: string) {
  const colors: Record<string, string> = { MOSS: "#6f896e", AMBER: "#d69d3c", NIGHT: "#26382c", ROSE: "#b77770" };
  return colors[theme] ?? "#7d8877";
}
function qaText(status: AnimationQa["qaStatus"]) { return { PENDING: "待质检", REVIEWING: "质检中", PASSED: "已通过", REJECTED: "需返工" }[status]; }
