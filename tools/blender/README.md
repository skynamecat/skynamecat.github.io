# 庞菠菠 Blender 工具

本目录只保存可重复执行的模型工具。权威动画母版是无动画的 `庞菠菠.fbx`；旧 GLB 仅用于视觉对照。

## 资产审计

```powershell
.\tools\blender\audit-assets.ps1
```

脚本使用本机 Blender 后台导入 FBX/GLB，并生成 `docs/pangbobo/asset-audit.json`。报告包含骨架、骨骼名、网格、顶点、材质和动画片段，不会修改源模型。

## 制作约束

- 骨架版本固定为 `skeleton-v1`（28 骨）。
- 正式动作从无动画 FBX 建立，不从旧 Action 继续叠加。
- 动画保持原地；网页位移由 Three.js 状态机控制。
- 第一批只制作并验收 `Idle`、`Walk`、`Groove`。

## 完整动作包

```powershell
.\tools\blender\build-action-pack.ps1
```

输出 `frontend/public/pangbobo/pangbobo-actions-complete.glb`，包含统一 28 骨骨架上的 24 个日常与舞蹈片段。构建会检查动作名称，缺少任何标准片段都会失败。

```powershell
.\tools\blender\validate-action-pack.ps1
```

验证动作名称、骨架数量和循环首尾姿势，结果写入 `docs/pangbobo/complete-pack-qa.json`。
