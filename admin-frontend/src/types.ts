export type Rarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC";
export type QaStatus = "PENDING" | "REVIEWING" | "PASSED" | "REJECTED";
export type AssetKind = "MODEL" | "TEXTURE" | "THUMBNAIL" | "AUDIO" | "OTHER";
export type AssetQuality = "LITE" | "BALANCED" | "FULL";
export type AssetStatus = "UPLOADED" | "PROCESSING" | "READY" | "REJECTED" | "ARCHIVED";
export type ReleaseStatus = "PUBLISHED" | "ROLLED_BACK" | "SUPERSEDED";

export type Variant = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  rarity: Rarity;
  weight: number;
  enabled: boolean;
  displayOrder: number;
  animationClip: string;
  thumbnailAssetId: number | null;
};

export type Series = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  theme: string;
  enabled: boolean;
  displayOrder: number;
  publishedVersion: number | null;
  updatedAt?: string;
  variants: Variant[];
};

export type Asset = {
  id: number;
  fileName: string;
  kind: AssetKind;
  contentType: string;
  size: number;
  url: string;
  checksum?: string;
  uploadedAt: string;
  assetKey: string;
  quality: AssetQuality;
  skeletonVersion: string;
  status: AssetStatus;
  metadata: Record<string, unknown> | null;
  updatedAt: string;
};

export type AssetUpdateInput = {
  quality: AssetQuality;
  skeletonVersion: string;
  status: AssetStatus;
  metadataJson: string;
};

export type AnimationQa = {
  id: number;
  name: string;
  displayName: string;
  modelUrl: string;
  duration: number;
  qaStatus: QaStatus;
  notes: string | null;
  updatedAt: string;
};

export type Release = {
  id: number;
  seriesId: number;
  seriesName: string;
  version: number;
  status: ReleaseStatus;
  variantCount: number;
  publishedBy: string;
  publishedAt: string;
  note: string | null;
};

export type SeriesInput = Omit<Series, "id" | "publishedVersion" | "variants" | "updatedAt">;
export type VariantInput = Omit<Variant, "id">;
export type ApiResponse<T> = { code: number; message?: string; data: T };
export type RouteKey = "studio" | "models" | "assets" | "motions" | "releases";
