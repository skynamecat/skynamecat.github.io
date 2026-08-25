import { useEffect, useState } from "react";
import type { AnimationQa, Asset, Variant, VariantInput } from "../types";

type Props = { variant?: Variant; motions: AnimationQa[]; assets: Asset[]; onSubmit: (input: VariantInput) => Promise<void>; onCancel: () => void };
const blank: VariantInput = { code: "", name: "", description: "", rarity: "COMMON", weight: 1, enabled: true, displayOrder: 0, animationClip: "Idle", thumbnailAssetId: null };

export function VariantForm({ variant, motions, assets, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState<VariantInput>(blank);
  const [saving, setSaving] = useState(false);
  useEffect(() => setValue(variant ? { ...variant } : blank), [variant]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try { await onSubmit(value); } finally { setSaving(false); }
  }
  return <form className="editor-form" onSubmit={submit}>
    <div className="form-grid">
      <label><span>款式代码</span><input required pattern="[a-z0-9_.-]+" value={value.code} onChange={(e) => setValue({ ...value, code: e.target.value })} disabled={Boolean(variant)} /></label>
      <label><span>款式名称</span><input required value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} /></label>
      <label><span>稀有度</span><select value={value.rarity} onChange={(e) => setValue({ ...value, rarity: e.target.value as VariantInput["rarity"] })}><option value="COMMON">常规</option><option value="UNCOMMON">特别</option><option value="RARE">稀有</option><option value="EPIC">隐藏</option></select></label>
      <label><span>抽取权重</span><input required type="number" min="0" max="100000" step="0.001" value={value.weight} onChange={(e) => setValue({ ...value, weight: Number(e.target.value) })} /></label>
      <label><span>动作片段</span><input list="motion-clips" required value={value.animationClip} onChange={(e) => setValue({ ...value, animationClip: e.target.value })} /><datalist id="motion-clips">{motions.map((motion) => <option value={motion.name} key={motion.id} />)}</datalist></label>
      <label><span>缩略图素材</span><select value={value.thumbnailAssetId ?? ""} onChange={(e) => setValue({ ...value, thumbnailAssetId: e.target.value ? Number(e.target.value) : null })}><option value="">不设置</option>{assets.filter((asset) => asset.kind === "THUMBNAIL").map((asset) => <option key={asset.id} value={asset.id}>{asset.fileName}</option>)}</select></label>
      <label><span>显示顺序</span><input type="number" value={value.displayOrder} onChange={(e) => setValue({ ...value, displayOrder: Number(e.target.value) })} /></label>
      <label className="toggle"><input type="checkbox" checked={value.enabled} onChange={(e) => setValue({ ...value, enabled: e.target.checked })} /><i /><span>参与抽取</span></label>
      <label className="wide"><span>款式说明</span><textarea rows={3} value={value.description ?? ""} onChange={(e) => setValue({ ...value, description: e.target.value })} /></label>
    </div>
    <div className="form-actions"><button type="button" onClick={onCancel}>取消</button><button className="primary" disabled={saving}>{saving ? "保存中…" : variant ? "保存款式" : "添加款式"}</button></div>
  </form>;
}
