"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadBlindboxManifest,
  pickWeightedVariant,
  type BlindboxManifest,
  type BlindboxRarity,
  type BlindboxSeries,
  type BlindboxVariant,
} from "./blindbox-data";

const BlindboxViewer = dynamic(
  () => import("./blindbox-viewer").then((module) => module.BlindboxViewer),
  {
    ssr: false,
    loading: () => <div className="blindbox-viewer-skeleton">正在搭建小舞台…</div>,
  },
);

const rarityCopy: Record<BlindboxRarity, { label: string; mark: string }> = {
  COMMON: { label: "日常", mark: "○" },
  UNCOMMON: { label: "闪光", mark: "◇" },
  RARE: { label: "珍藏", mark: "✦" },
  EPIC: { label: "隐藏", mark: "★" },
};

const COLLECTION_KEY = "pangbobo-blindbox-collection-v2";
const HISTORY_KEY = "pangbobo-blindbox-history-v1";

type DrawHistoryEntry = {
  id: string;
  seriesCode: string;
  variantCode: string;
  drawnAt: string;
};

type BlindboxPanel = "collection" | "history" | null;

function loadCollection() {
  try {
    const value = JSON.parse(localStorage.getItem(COLLECTION_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function loadHistory(): DrawHistoryEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is DrawHistoryEntry => (
      item !== null
      && typeof item === "object"
      && typeof item.id === "string"
      && typeof item.seriesCode === "string"
      && typeof item.variantCode === "string"
      && typeof item.drawnAt === "string"
    )).slice(0, 100);
  } catch {
    return [];
  }
}

function historyTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function identity(seriesCode: string, variantCode: string) {
  return `${seriesCode}:${variantCode}`;
}

function sourceLabel(manifest: BlindboxManifest | null) {
  if (!manifest) return "正在读取今日清单";
  if (manifest.source === "published") return "在线发布清单";
  if (manifest.source === "series") return "在线系列清单";
  return "本地只读图鉴";
}

export function BlindboxClient() {
  const [manifest, setManifest] = useState<BlindboxManifest | null>(null);
  const [activeCode, setActiveCode] = useState("daily");
  const [selected, setSelected] = useState<BlindboxVariant | null>(null);
  const [opening, setOpening] = useState(false);
  const [collection, setCollection] = useState<string[]>([]);
  const [history, setHistory] = useState<DrawHistoryEntry[]>([]);
  const [panel, setPanel] = useState<BlindboxPanel>(null);
  const openingTimerRef = useRef<number | null>(null);
  const collectionCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    loadBlindboxManifest().then((value) => {
      if (!active) return;
      setManifest(value);
      setActiveCode((current) => (
        value.series.some((series) => series.code === current) ? current : value.series[0]?.code ?? "daily"
      ));
    });
    const collectionTimer = window.setTimeout(() => {
      setCollection(loadCollection());
      setHistory(loadHistory());
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(collectionTimer);
      if (openingTimerRef.current) window.clearTimeout(openingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!panel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    const focusTimer = window.setTimeout(() => collectionCloseRef.current?.focus(), 0);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [panel]);

  const series = useMemo<BlindboxSeries | null>(() => (
    manifest?.series.find((item) => item.code === activeCode) ?? manifest?.series[0] ?? null
  ), [activeCode, manifest]);
  const seriesCollection = series
    ? collection.filter((key) => key.startsWith(`${series.code}:`))
    : [];

  const openBox = () => {
    if (!series || opening || series.variants.length === 0) return;
    setOpening(true);
    const variant = pickWeightedVariant(series.variants);
    openingTimerRef.current = window.setTimeout(() => {
      setSelected(variant);
      setOpening(false);
      openingTimerRef.current = null;
      const key = identity(series.code, variant.code);
      const historyEntry: DrawHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        seriesCode: series.code,
        variantCode: variant.code,
        drawnAt: new Date().toISOString(),
      };
      setHistory((current) => {
        const next = [historyEntry, ...current].slice(0, 100);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        return next;
      });
      setCollection((current) => {
        if (current.includes(key)) return current;
        const next = [...current, key];
        localStorage.setItem(COLLECTION_KEY, JSON.stringify(next));
        return next;
      });
    }, 1280);
  };

  const selectSeries = (nextSeries: BlindboxSeries) => {
    if (openingTimerRef.current) window.clearTimeout(openingTimerRef.current);
    openingTimerRef.current = null;
    setActiveCode(nextSeries.code);
    setSelected(null);
    setOpening(false);
    setPanel(null);
  };

  const revealCollected = (variant: BlindboxVariant) => {
    setSelected(variant);
    setPanel(null);
  };

  return (
    <main className={`blindbox-page blindbox-theme-${series?.theme.toLowerCase() ?? "daily"}`}>
      <div className="blindbox-grain" aria-hidden="true" />
      <header className="blindbox-header">
        <Link className="blindbox-home-link" href="/" aria-label="返回 skynamecat 首页">
          <span aria-hidden="true">←</span> skynamecat
        </Link>
        <div className="blindbox-source" title="页面优先读取后台发布清单">
          <i className={manifest?.source === "fallback" ? "is-fallback" : ""} />
          {sourceLabel(manifest)}
        </div>
      </header>

      <section className="blindbox-intro" aria-labelledby="blindbox-title">
        <p className="blindbox-kicker">PANGBOBO / POCKET MOMENTS</p>
        <h1 id="blindbox-title">庞菠菠<br /><em>今日盲盒</em></h1>
        <p className="blindbox-lead">把一个普通瞬间装进小盒子。<br />拆开它，看看今天的庞菠菠在做什么。</p>
        <div className="blindbox-series-tabs" aria-label="选择盲盒系列">
          {manifest?.series.map((item) => (
            <button
              key={item.code}
              type="button"
              className={item.code === series?.code ? "is-active" : ""}
              onClick={() => selectSeries(item)}
            >
              <span>{item.code === "hiphop" ? "02" : "01"}</span>
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <section className={`blindbox-stage-card${selected ? " has-reveal" : ""}${opening ? " is-opening" : ""}`} aria-live="polite">
        {!selected ? (
          <div className="blindbox-box-scene">
            <div className="blindbox-paper-box" aria-hidden="true">
              <i className="box-lid" />
              <i className="box-face"><span>庞<br />菠<br />菠</span></i>
              <i className="box-side" />
              <i className="box-shadow" />
            </div>
            {opening && <div className="blindbox-opening-burst" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>}
            <div className="blindbox-stage-copy">
              <p>{opening ? "盒子里有一点动静…" : series?.description ?? "正在准备今天的盒子。"}</p>
              <button type="button" onClick={openBox} disabled={!series || opening}>
                <span>{opening ? "开启中" : "拆开一只"}</span>
                <i aria-hidden="true">↗</i>
              </button>
              <small>3D 模型会在开启后按设备性能加载</small>
            </div>
          </div>
        ) : series ? (
          <div className="blindbox-reveal">
            <div className="blindbox-model-shell">
              <BlindboxViewer
                key={`${series.code}:${selected.code}`}
                seriesCode={series.code}
                animationClip={selected.animationClip}
                variantName={selected.name}
                modelAssetKey={series.modelAssetKey}
              />
              <span className={`blindbox-rarity rarity-${selected.rarity.toLowerCase()}`}>
                {rarityCopy[selected.rarity].mark} {rarityCopy[selected.rarity].label}
              </span>
            </div>
            <div className="blindbox-reveal-copy">
              <p className="blindbox-reveal-index">
                {(series.variants.findIndex((item) => item.code === selected.code) + 1).toString().padStart(2, "0")}
                <span>/ {series.variants.length.toString().padStart(2, "0")}</span>
              </p>
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
              <div className="blindbox-actions">
                <button type="button" onClick={() => setSelected(null)}>再拆一只</button>
                <button type="button" onClick={() => setPanel("collection")}>查看图鉴</button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <aside className="blindbox-progress" aria-label="收集进度">
        <div className="blindbox-progress-actions">
          <button type="button" onClick={() => setPanel("collection")} disabled={!series}>
            <span>MY SHELF</span>
            <strong>{seriesCollection.length.toString().padStart(2, "0")} / {series?.variants.length.toString().padStart(2, "0") ?? "--"}</strong>
          </button>
          <button type="button" onClick={() => setPanel("history")} disabled={history.length === 0}>
            <span>HISTORY</span>
            <strong>{history.length.toString().padStart(2, "0")}</strong>
          </button>
        </div>
        <div className="blindbox-progress-meter"><i style={{ width: `${series ? seriesCollection.length / series.variants.length * 100 : 0}%` }} /></div>
      </aside>

      {panel && series && (
        <div className="blindbox-collection-backdrop">
          <button
            className="blindbox-collection-dismiss"
            type="button"
            onClick={() => setPanel(null)}
            aria-label="关闭面板"
            tabIndex={-1}
          />
          <section className="blindbox-collection" role="dialog" aria-modal="true" aria-labelledby="blindbox-panel-title">
            <header>
              <div>
                <p>{panel === "collection" ? `COLLECTION / ${series.code.toUpperCase()}` : "DRAW HISTORY / RECENT 100"}</p>
                <h2 id="blindbox-panel-title">{panel === "collection" ? "我的庞菠菠图鉴" : "相遇记录"}</h2>
              </div>
              <button ref={collectionCloseRef} type="button" onClick={() => setPanel(null)} aria-label="关闭面板">×</button>
            </header>
            {panel === "collection" ? <div className="blindbox-collection-grid">
              {series.variants.map((variant, index) => {
                const unlocked = collection.includes(identity(series.code, variant.code));
                return (
                  <button
                    key={variant.code}
                    type="button"
                    className={unlocked ? "is-unlocked" : ""}
                    onClick={() => unlocked && revealCollected(variant)}
                    disabled={!unlocked}
                    aria-label={unlocked ? `查看 ${variant.name}` : `第 ${index + 1} 款尚未收集`}
                  >
                    <span>{(index + 1).toString().padStart(2, "0")}</span>
                    <i>{unlocked ? rarityCopy[variant.rarity].mark : "?"}</i>
                    <strong>{unlocked ? variant.name : "未相遇"}</strong>
                  </button>
                );
              })}
            </div> : <div className="blindbox-history-list">
              {history.map((entry) => {
                const entrySeries = manifest?.series.find((item) => item.code === entry.seriesCode);
                const variant = entrySeries?.variants.find((item) => item.code === entry.variantCode);
                return (
                  <article key={entry.id}>
                    <span>{rarityCopy[variant?.rarity ?? "COMMON"].mark}</span>
                    <div>
                      <strong>{variant?.name ?? entry.variantCode}</strong>
                      <small>{entrySeries?.name ?? entry.seriesCode}</small>
                    </div>
                    <time dateTime={entry.drawnAt}>{historyTime(entry.drawnAt)}</time>
                  </article>
                );
              })}
            </div>}
          </section>
        </div>
      )}
    </main>
  );
}
