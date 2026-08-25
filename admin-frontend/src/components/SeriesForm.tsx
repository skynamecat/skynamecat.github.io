import { useEffect, useState } from "react";
import type { Series, SeriesInput } from "../types";

type Props = { series?: Series; onSubmit: (input: SeriesInput) => Promise<void>; onCancel?: () => void };
const blank: SeriesInput = { code: "", name: "", description: "", theme: "MOSS", enabled: true, displayOrder: 0 };

export function SeriesForm({ series, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState<SeriesInput>(blank);
  const [saving, setSaving] = useState(false);
  useEffect(() => setValue(series ? {
    code: series.code, name: series.name, description: series.description, theme: series.theme,
    enabled: series.enabled, displayOrder: series.displayOrder
  } : blank), [series]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try { await onSubmit(value); } finally { setSaving(false); }
  }

  return <form className="editor-form" onSubmit={submit}>
    <div className="form-grid">
      <label><span>系列代码</span><input required maxLength={64} pattern="[a-z0-9_.-]+" value={value.code} onChange={(e) => setValue({ ...value, code: e.target.value })} disabled={Boolean(series)} /></label>
      <label><span>系列名称</span><input required maxLength={120} value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} /></label>
      <label><span>主题标识</span><input required maxLength={32} value={value.theme} onChange={(e) => setValue({ ...value, theme: e.target.value.toUpperCase() })} /></label>
      <label><span>显示顺序</span><input type="number" value={value.displayOrder} onChange={(e) => setValue({ ...value, displayOrder: Number(e.target.value) })} /></label>
      <label className="wide"><span>系列说明</span><textarea rows={3} maxLength={500} value={value.description ?? ""} onChange={(e) => setValue({ ...value, description: e.target.value })} /></label>
      <label className="toggle wide"><input type="checkbox" checked={value.enabled} onChange={(e) => setValue({ ...value, enabled: e.target.checked })} /><i /><span>允许这个系列在前台出现</span></label>
    </div>
    <div className="form-actions">{onCancel && <button type="button" onClick={onCancel}>取消</button>}<button className="primary" disabled={saving}>{saving ? "保存中…" : series ? "保存系列" : "创建系列"}</button></div>
  </form>;
}
