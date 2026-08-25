import { useMemo, useState } from "react";
import type { Variant } from "../types";

type Props = { variants: Variant[] };

export function ProbabilitySimulator({ variants }: Props) {
  const [draws, setDraws] = useState(1000);
  const [run, setRun] = useState(0);
  const enabled = useMemo(() => variants.filter((item) => item.enabled && item.weight > 0), [variants]);
  const total = enabled.reduce((sum, item) => sum + item.weight, 0);
  const results = useMemo(() => simulate(enabled, draws), [enabled, draws, run]);

  return <section className="panel probability-lab">
    <div className="panel-heading">
      <div><span>概率实验室</span><h2>抽取分布模拟</h2></div>
      <div className="simulation-actions">
        <select aria-label="模拟次数" value={draws} onChange={(event) => setDraws(Number(event.target.value))}>
          <option value={100}>100 抽</option><option value={1000}>1,000 抽</option><option value={10000}>10,000 抽</option>
        </select>
        <button onClick={() => setRun((value) => value + 1)} disabled={!enabled.length}>重新模拟</button>
      </div>
    </div>
    {!enabled.length ? <p className="inline-empty">至少启用一个权重大于 0 的款式才能模拟。</p> : <div className="probability-table">
      <div className="probability-head"><span>款式</span><span>理论</span><span>模拟</span><span>偏差</span></div>
      {enabled.map((variant) => {
        const expected = variant.weight / total * 100;
        const actual = (results.get(variant.id) ?? 0) / draws * 100;
        const delta = actual - expected;
        return <div className="probability-row" key={variant.id}>
          <span><i className={`rarity-dot ${variant.rarity.toLowerCase()}`} />{variant.name}</span>
          <b>{expected.toFixed(2)}%</b><b>{actual.toFixed(2)}%</b>
          <em className={Math.abs(delta) > 2 ? "warning" : ""}>{delta >= 0 ? "+" : ""}{delta.toFixed(2)}%</em>
          <span className="distribution-track"><i style={{ width: `${Math.max(actual, .6)}%` }} /></span>
        </div>;
      })}
    </div>}
    <footer><span>总权重 {total.toFixed(3)}</span><span>{enabled.length} 个有效款式</span><span>模拟仅用于配置检查，不改变线上概率</span></footer>
  </section>;
}

function simulate(variants: Variant[], draws: number) {
  const counts = new Map<number, number>();
  const total = variants.reduce((sum, item) => sum + item.weight, 0);
  for (let index = 0; index < draws; index += 1) {
    let cursor = Math.random() * total;
    const selected = variants.find((item) => (cursor -= item.weight) <= 0) ?? variants.at(-1);
    if (selected) counts.set(selected.id, (counts.get(selected.id) ?? 0) + 1);
  }
  return counts;
}
