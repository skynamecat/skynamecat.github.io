export type Variant = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC";
  weight: number;
  enabled: boolean;
  displayOrder: number;
  animationClip: string;
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
  variants: Variant[];
};

export type ApiResponse<T> = { code: number; data: T };
