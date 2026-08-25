import { useMemo, useRef, useState } from "react";
import { blindboxApi } from "../api";
import { ConfirmButton } from "../components/ConfirmButton";
import { EmptyState } from "../components/EmptyState";
import type { Asset, AssetKind } from "../types";

type Props = { assets: Asset[]; reload: () => Promise<void>; report: (message: string, busy?: boolean) => void };
const kindName: Record<AssetKind, string> = { MODEL: "3D 模型", TEXTURE: "贴图", THUMBNAIL: "缩略图", AUDIO: "音频", OTHER: "其他" };

export function AssetsView({ assets, reload, report }: Props) {
  const [kind, setKind] = useState<AssetKind | "ALL">("ALL");
  const [uploadKind, setUploadKind] = useState<AssetKind>("MODEL");
  const inputRef = useRef<HTMLInputElement>(null);
  const visible = useMemo(() => kind === "ALL" ? assets : assets.filter((item) => item.kind === kind), [assets, kind]);

  async function upload(file?: File) {
    if (!file) return;
    report(`正在上传 ${file.name}…`, true);
    try { await blindboxApi.uploadAsset(file, uploadKind); await reload(); report(`${file.name} 已入库`); if (inputRef.current) inputRef.current.value = ""; }
    catch (error) { report(error instanceof Error ? error.message : "上传失败"); }
  }
  async function remove(asset: Asset) {
    report(`正在删除 ${asset.fileName}…`, true);
    try { await blindboxApi.deleteAsset(asset.id); await reload(); report("素材已删除"); }
    catch (error) { report(error instanceof Error ? error.message : "删除失败"); }
  }

  return <>
    <header className="topbar"><div><p>ASSET CABINET</p><h1>把每一份素材，放在该在的位置。</h1></div><div className="asset-counter"><b>{assets.length}</b><span>份素材</span></div></header>
    <section className="panel upload-panel">
      <div><span>上传素材</span><h2>模型、贴图、缩略图与声音</h2><p>文件上传后由后台生成校验摘要，发布快照只引用已入库素材。</p></div>
      <label><span>素材类型</span><select value={uploadKind} onChange={(e) => setUploadKind(e.target.value as AssetKind)}>{Object.entries(kindName).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="file-picker"><input ref={inputRef} type="file" onChange={(e) => void upload(e.target.files?.[0])} accept={acceptFor(uploadKind)} /><span>选择文件上传</span><small>单文件上传 · Session + CSRF 保护</small></label>
    </section>
    <div className="toolbar"><div className="filter-tabs"><button className={kind === "ALL" ? "active" : ""} onClick={() => setKind("ALL")}>全部</button>{Object.entries(kindName).map(([value, label]) => <button key={value} className={kind === value ? "active" : ""} onClick={() => setKind(value as AssetKind)}>{label}</button>)}</div><span>显示 {visible.length} / {assets.length}</span></div>
    {!visible.length ? <EmptyState title="这个分类还没有素材" detail="选择上方类型，然后上传第一份文件。" /> : <section className="asset-grid">{visible.map((asset) => <article className="asset-card" key={asset.id}>
      <div className={`asset-preview ${asset.kind.toLowerCase()}`}>{isImage(asset) ? <img src={asset.url} alt="" loading="lazy" /> : <span>{asset.kind === "MODEL" ? "3D" : asset.kind === "AUDIO" ? "♪" : "FILE"}</span>}</div>
      <div className="asset-copy"><span>{kindName[asset.kind]}</span><h3 title={asset.fileName}>{asset.fileName}</h3><p>{formatBytes(asset.size)} · {formatDate(asset.uploadedAt)}</p></div>
      <div className="asset-actions"><a href={asset.url} target="_blank" rel="noreferrer">打开</a><ConfirmButton question={`确定删除“${asset.fileName}”？已被款式引用的素材可能无法删除。`} onClick={() => void remove(asset)}>删除</ConfirmButton></div>
    </article>)}</section>}
  </>;
}

function isImage(asset: Asset) { return asset.contentType.startsWith("image/"); }
function acceptFor(kind: AssetKind) { return { MODEL: ".glb,.gltf,.fbx", TEXTURE: "image/*", THUMBNAIL: "image/*", AUDIO: "audio/*", OTHER: "*/*" }[kind]; }
function formatBytes(value: number) { if (value < 1024) return `${value} B`; if (value < 1048576) return `${(value / 1024).toFixed(1)} KB`; return `${(value / 1048576).toFixed(1)} MB`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
