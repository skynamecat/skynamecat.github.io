# 盲盒管理端 API 契约

根路径：`/api/admin/blindbox`。除 `204 No Content` 外，JSON 响应可使用统一信封：

```json
{ "code": 0, "message": "ok", "data": {} }
```

前端同时兼容直接返回 `data`。所有接口要求已登录的 Spring Security Session；写请求要求 Cookie `XSRF-TOKEN` 对应的 `X-XSRF-TOKEN` 请求头。

## 会话

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/session` | 建立/刷新管理 Session 与 CSRF Cookie |

## 系列与款式

| 方法 | 路径 | 请求/响应 |
|---|---|---|
| GET | `/series` | 返回 `Series[]`，每个系列内嵌 `variants` |
| POST | `/series` | `SeriesInput` → `Series` |
| PUT | `/series/{id}` | `SeriesInput` → `Series` |
| DELETE | `/series/{id}` | `204` |
| POST | `/series/{id}/variants` | `VariantInput` → `Variant` |
| PUT | `/series/{id}/variants/{variantId}` | `VariantInput` → `Variant` |
| DELETE | `/series/{id}/variants/{variantId}` | `204` |

`SeriesInput` 字段：`code,name,description,theme,enabled,displayOrder`。

`VariantInput` 字段：`code,name,description,rarity,weight,enabled,displayOrder,animationClip,thumbnailAssetId`。`rarity` 为 `COMMON | UNCOMMON | RARE | EPIC`。

## 素材

| 方法 | 路径 | 请求/响应 |
|---|---|---|
| GET | `/assets` | 返回 `Asset[]` |
| POST | `/assets` | `multipart/form-data`：`file`、`kind` → `Asset` |
| DELETE | `/assets/{id}` | 未被引用时返回 `204`，被引用建议返回 `409` 与说明 |

`kind` 为 `MODEL | TEXTURE | THUMBNAIL | AUDIO | OTHER`。`Asset` 至少包含 `id,fileName,kind,contentType,size,url,uploadedAt`。

## 动作质检

| 方法 | 路径 | 请求/响应 |
|---|---|---|
| GET | `/motions` | 返回 `AnimationQa[]` |
| PATCH | `/motions/{id}/qa` | `{qaStatus,notes}` → `AnimationQa` |

`AnimationQa` 字段：`id,name,displayName,modelUrl,duration,qaStatus,notes,updatedAt`。`qaStatus` 为 `PENDING | REVIEWING | PASSED | REJECTED`。

## 发布与回滚

| 方法 | 路径 | 请求/响应 |
|---|---|---|
| GET | `/releases?seriesId=` | 返回 `Release[]`，按发布时间倒序 |
| POST | `/series/{id}/publish` | `{note}` → 新 `Release` |
| POST | `/releases/{id}/rollback` | `{}` → 由目标快照生成的新 `Release` |

`Release` 字段：`id,seriesId,seriesName,version,status,variantCount,publishedBy,publishedAt,note`。`status` 为 `PUBLISHED | ROLLED_BACK | SUPERSEDED`。

发布和回滚必须由后端事务完成；回滚不应覆盖历史记录，而应从旧快照生成一个递增版本号的新发布记录。
