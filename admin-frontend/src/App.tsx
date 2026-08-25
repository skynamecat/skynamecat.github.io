import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { blindboxApi } from "./api";
import type { Series } from "./types";

const ModelStage = lazy(() => import("./ModelStage").then((module) => ({ default: module.ModelStage })));

const rarityName = { COMMON: "常规", UNCOMMON: "特别", RARE: "稀有", EPIC: "隐藏" } as const;

export default function App() {
  const [series, setSeries] = useState<Series[]>([]);
  const [selectedSeries, setSelectedSeries] = useState(0);
  const [selectedClip, setSelectedClip] = useState("Idle");
  const [status, setStatus] = useState("正在连接后台…");
  const active = series[selectedSeries];

  useEffect(() => {
    blindboxApi.listSeries()
      .then((data) => {
        setSeries(data);
        setStatus(`已同步 ${data.length} 个系列`);
        const firstClip = data[0]?.variants[0]?.animationClip;
        if (firstClip) setSelectedClip(firstClip);
      })
      .catch((error: Error) => setStatus(error.message));
  }, []);

  const totalWeight = useMemo(
    () => active?.variants.filter((item) => item.enabled).reduce((sum, item) => sum + item.weight, 0) ?? 0,
    [active]
  );

  async function publish() {
    if (!active) return;
    setStatus("正在生成发布快照…");
    try {
      const release = await blindboxApi.publish(active.id);
      setStatus(`版本 v${release.version} 已发布`);
      const next = await blindboxApi.listSeries();
      setSeries(next);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "发布失败");
    }
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand"><span>庞</span><div><strong>庞菠菠</strong><small>BLINDBOX STUDIO</small></div></div>
        <nav aria-label="管理模块">
          <button className="active"><i>01</i>盲盒工作台</button>
          <button><i>02</i>素材与版本</button>
          <button><i>03</i>动作质检</button>
          <button><i>04</i>发布记录</button>
        </nav>
        <div className="sidebar-note"><b>动作基线</b><span>skeleton-v1</span><small>Idle / Walk / Groove 待精修</small></div>
      </aside>

      <main>
        <header className="topbar">
          <div><p>BLINDBOX CONTROL ROOM</p><h1>让每一个动作，都有重心。</h1></div>
          <div className="top-actions"><span className="sync-dot">{status}</span><button className="publish" onClick={publish} disabled={!active}>发布当前系列</button></div>
        </header>

        <section className="workspace">
          <div className="series-panel panel">
            <div className="panel-heading"><div><span>系列配置</span><h2>{active?.name ?? "等待后台数据"}</h2></div><label>当前系列<select value={selectedSeries} onChange={(e) => setSelectedSeries(Number(e.target.value))}>{series.map((item, index) => <option key={item.id} value={index}>{item.name}</option>)}</select></label></div>
            <div className="metrics"><article><small>款式</small><strong>{active?.variants.length ?? 0}</strong></article><article><small>总权重</small><strong>{totalWeight}</strong></article><article><small>线上版本</small><strong>{active?.publishedVersion ? `v${active.publishedVersion}` : "草稿"}</strong></article></div>
            <div className="variant-list">
              {active?.variants.map((variant) => {
                const chance = totalWeight ? (variant.weight / totalWeight) * 100 : 0;
                return <button key={variant.id} className={selectedClip === variant.animationClip ? "selected" : ""} onClick={() => setSelectedClip(variant.animationClip)}>
                  <span className={`rarity ${variant.rarity.toLowerCase()}`}>{rarityName[variant.rarity]}</span>
                  <span className="variant-copy"><b>{variant.name}</b><small>{variant.animationClip}</small></span>
                  <span className="probability"><b>{chance.toFixed(1)}%</b><i style={{ "--chance": `${chance}%` } as React.CSSProperties} /></span>
                </button>;
              })}
            </div>
          </div>

          <div className="preview-column">
            <section className="preview-panel panel">
              <div className="panel-heading"><div><span>动作预览</span><h2>{selectedClip}</h2></div><span className="qa-badge">原型动作 · 待质检</span></div>
              <Suspense fallback={<div className="model-stage stage-loading">正在准备 3D 检查台…</div>}>
                <ModelStage clipName={selectedClip} />
              </Suspense>
              <div className="timeline"><b>播放检查</b><span /><em>循环 · 1.0×</em></div>
            </section>
            <section className="quality-panel panel"><div><span>本轮制作门槛</span><h3>脚不滑，重心不漂，过渡不弹。</h3></div><ol><li><b>01</b>Idle 呼吸与首尾连续</li><li><b>02</b>Walk 足底锁定与手脚协调</li><li><b>03</b>Groove 髋胸肩节奏传递</li></ol></section>
          </div>
        </section>
      </main>
    </div>
  );
}
