import { useMemo, useRef, useState } from "react";
import { blindboxApi } from "../api";
import { ConfirmButton } from "../components/ConfirmButton";
import { EmptyState } from "../components/EmptyState";
import { ModelStage } from "../ModelStage";
import type { Asset, AssetQuality, AssetStatus, AssetUpdateInput } from "../types";

type Props = {
  assets: Asset[];
  reload: () => Promise<void>;
  report: (message: string, busy?: boolean) => void;
};

const qualityLabel: Record<AssetQuality, string> = { LITE: "轻量", BALANCED: "均衡", FULL: "完整" };
const statusLabel: Record<AssetStatus, string> = {
  UPLOADED: "已上传",
  PROCESSING: "处理中",
  READY: "可发布",
  REJECTED: "已驳回",
  ARCHIVED: "已归档",
};

export function ModelsView({ assets, reload, report }: Props) {
  const models = useMemo(() => assets.filter((asset) => asset.kind === "MODEL"), [assets]);
  const [selectedId, setSelectedId] = useState<number | null>(models[0]?.id ?? null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = models.find((asset) => asset.id === selectedId) ?? models[0] ?? null;
  const readyCount = models.filter((asset) => asset.status === "READY").length;
  const totalSize = models.reduce((sum, asset) => sum + asset.size, 0);

  async function upload(file?: File) {
    if (!file) return;
    if (!/\.(glb|gltf)$/i.test(file.name)) {
      report("网页端模型请使用 GLB 或 glTF 格式");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    report(`正在上传模型 ${file.name}…`, true);
    try {
      const created = await blindboxApi.uploadAsset(file, "MODEL");
      await reload();
      setSelectedId(created.id);
      report(`${file.name} 已进入模型库`);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      report(error instanceof Error ? error.message : "模型上传失败");
    }
  }

  async function archive(asset: Asset) {
    report(`正在归档 ${asset.fileName}…`, true);
    try {
      await blindboxApi.deleteAsset(asset.id);
      setSelectedId(null);
      await reload();
      report("模型已归档");
    } catch (error) {
      report(error instanceof Error ? error.message : "模型归档失败");
    }
  }

  return <>
    <header className="topbar models-topbar">
      <div><p>MODEL REGISTRY</p><h1>模型不是文件，<br />是一套可追踪的制作基线。</h1></div>
      <dl className="model-stats">
        <div><dt>模型</dt><dd>{models.length}</dd></div>
        <div><dt>可发布</dt><dd>{readyCount}</dd></div>
        <div><dt>总容量</dt><dd>{formatBytes(totalSize)}</dd></div>
      </dl>
    </header>

    <section className="panel model-upload-strip">
      <div><span>导入模型</span><h2>上传 GLB / glTF</h2><p>建议使用 GLB；贴图、骨骼和动作可以随文件一并封装。</p></div>
      <label className="file-picker model-file-picker">
        <input ref={inputRef} type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={(event) => void upload(event.target.files?.[0])} />
        <span>选择模型文件</span><small>上传后自动生成资产标识与校验摘要</small>
      </label>
    </section>

    {!models.length ? <EmptyState title="模型库还是空的" detail="上传第一份 GLB 模型，之后可以在这里预览、维护质量等级和发布状态。" /> : selected && <section className="model-management-grid">
      <aside className="panel model-register" aria-label="模型列表">
        <header><span>模型清单</span><strong>{models.length.toString().padStart(2, "0")}</strong></header>
        <div>{models.map((asset, index) => <button type="button" key={asset.id} className={asset.id === selected.id ? "selected" : ""} onClick={() => setSelectedId(asset.id)}>
          <i>{(index + 1).toString().padStart(2, "0")}</i>
          <span><b>{asset.fileName}</b><small>{asset.assetKey}</small></span>
          <em className={`model-status status-${asset.status.toLowerCase()}`}>{statusLabel[asset.status]}</em>
        </button>)}</div>
      </aside>

      <section className="panel model-preview-panel">
        <header className="panel-heading"><div><span>实时预览</span><h2>{selected.fileName}</h2></div><span className="stage-hint">拖动旋转 · 滚轮缩放</span></header>
        <ModelStage clipName="Idle" modelUrl={selected.url} />
        <dl className="model-file-facts">
          <div><dt>资产标识</dt><dd>{selected.assetKey}</dd></div>
          <div><dt>文件大小</dt><dd>{formatBytes(selected.size)}</dd></div>
          <div><dt>校验摘要</dt><dd title={selected.checksum}>{selected.checksum?.slice(0, 12) ?? "—"}</dd></div>
          <div><dt>更新时间</dt><dd>{formatDate(selected.updatedAt || selected.uploadedAt)}</dd></div>
        </dl>
      </section>

      <ModelEditor
        key={`${selected.id}:${selected.updatedAt}`}
        asset={selected}
        reload={reload}
        report={report}
        onArchive={() => void archive(selected)}
      />
    </section>}
  </>;
}

function ModelEditor({ asset, reload, report, onArchive }: {
  asset: Asset;
  reload: () => Promise<void>;
  report: (message: string, busy?: boolean) => void;
  onArchive: () => void;
}) {
  const [value, setValue] = useState<AssetUpdateInput>({
    quality: asset.quality,
    skeletonVersion: asset.skeletonVersion || "n/a",
    status: asset.status,
    metadataJson: asset.metadata ? JSON.stringify(asset.metadata, null, 2) : "{}",
  });

  async function save() {
    try {
      JSON.parse(value.metadataJson || "{}");
    } catch {
      report("元数据必须是有效的 JSON 对象");
      return;
    }
    report("正在保存模型设置…", true);
    try {
      await blindboxApi.updateAsset(asset.id, value);
      await reload();
      report("模型设置已保存");
    } catch (error) {
      report(error instanceof Error ? error.message : "保存失败");
    }
  }

  return <aside className="panel model-inspector">
    <header><div><span>模型设置</span><h2>制作与发布</h2></div><code>#{asset.id}</code></header>
    <div className="model-form">
      <label><span>质量等级</span><select value={value.quality} onChange={(event) => setValue({ ...value, quality: event.target.value as AssetQuality })}>{Object.entries(qualityLabel).map(([quality, label]) => <option key={quality} value={quality}>{label}</option>)}</select></label>
      <label><span>骨骼版本</span><input required maxLength={40} value={value.skeletonVersion} onChange={(event) => setValue({ ...value, skeletonVersion: event.target.value })} placeholder="例如 skeleton-v1" /></label>
      <label><span>发布状态</span><select value={value.status} onChange={(event) => setValue({ ...value, status: event.target.value as AssetStatus })}>{Object.entries(statusLabel).filter(([status]) => status !== "ARCHIVED").map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label>
      <label><span>JSON 元数据</span><textarea rows={9} spellCheck={false} value={value.metadataJson} onChange={(event) => setValue({ ...value, metadataJson: event.target.value })} /></label>
      <button className="primary model-save" type="button" onClick={() => void save()}>保存模型设置</button>
    </div>
    <div className="model-archive-zone"><div><b>归档模型</b><small>已被系列或动作引用的模型无法归档。</small></div><ConfirmButton question={`确定归档“${asset.fileName}”？`} onClick={onArchive}>归档</ConfirmButton></div>
  </aside>;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1048576) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1048576).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
