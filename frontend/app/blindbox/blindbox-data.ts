export type BlindboxRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC";

export type BlindboxVariant = {
  code: string;
  name: string;
  description: string;
  rarity: BlindboxRarity;
  weight: number;
  displayOrder: number;
  animationClip: string;
};

export type BlindboxSeries = {
  code: string;
  name: string;
  description: string;
  theme: string;
  version?: number;
  modelAssetKey?: string;
  variants: BlindboxVariant[];
};

export type ManifestSource = "published" | "series" | "fallback";

export type BlindboxManifest = {
  source: ManifestSource;
  series: BlindboxSeries[];
};

const dailyVariants: BlindboxVariant[] = [
  ["idle", "发发呆", "把脑袋里的进度条暂停一会儿。", "COMMON", 20, "Idle"],
  ["walk", "散散步", "慢慢走，也算抵达。", "COMMON", 18, "Walk"],
  ["rest", "歇一会", "今天的云很适合做枕头。", "COMMON", 16, "Rest"],
  ["stretch", "伸懒腰", "把困意拉成长长的一条线。", "UNCOMMON", 10, "Stretch"],
  ["look", "四处看看", "角落里也许藏着新的小事。", "COMMON", 14, "Look"],
  ["wave", "打招呼", "嗨，很高兴今天也遇见你。", "UNCOMMON", 8, "Wave"],
  ["phone", "玩手机", "再看一小会儿，就一小会儿。", "UNCOMMON", 7, "Phone"],
  ["laptop", "看电脑", "认真工作，偶尔摸一条鱼。", "RARE", 3, "Laptop"],
  ["happy", "开心一下", "今天有一颗轻轻发亮的心。", "UNCOMMON", 7, "Happy"],
  ["music", "听歌", "戴上耳机，把世界调成喜欢的音量。", "RARE", 3, "Music"],
  ["drink", "喝奶茶", "吨吨吨，补充一点甜甜能量。", "RARE", 2, "Drink"],
  ["cake", "吃蛋糕", "最后一口也要认真幸福。", "EPIC", 1, "EatCake"],
].map(([code, name, description, rarity, weight, animationClip], index) => ({
  code: code as string,
  name: name as string,
  description: description as string,
  rarity: rarity as BlindboxRarity,
  weight: weight as number,
  displayOrder: (index + 1) * 10,
  animationClip: animationClip as string,
}));

const hiphopVariants: BlindboxVariant[] = [
  ["bounce", "Bounce", "先让膝盖听懂节拍。", "COMMON", 18, "Bounce"],
  ["body-wave", "Body Wave", "一阵波浪从头顶流到脚尖。", "COMMON", 16, "BodyWave"],
  ["slide", "Slide", "鞋底偷偷借走了一小块冰面。", "COMMON", 14, "Slide"],
  ["arm-wave", "Arm Wave", "指尖、手腕、手肘，接力一阵风。", "UNCOMMON", 10, "ArmWave"],
  ["locking", "Locking", "啪——把这一拍稳稳锁住。", "UNCOMMON", 9, "Locking"],
  ["popping", "Popping", "每一次震动都有自己的标点。", "UNCOMMON", 8, "Popping"],
  ["groove", "Groove", "身体知道下一拍要往哪里去。", "COMMON", 13, "Groove"],
  ["robot", "Robot", "庞菠菠系统正在节奏校准。", "RARE", 4, "Robot"],
  ["kick-step", "Kick Step", "踢、踏、收，一气呵成。", "UNCOMMON", 7, "KickStep"],
  ["spin", "Spin", "让视线追不上这一圈。", "RARE", 3, "Spin"],
  ["freeze", "Freeze", "在最漂亮的一帧按下暂停。", "RARE", 2, "Freeze"],
  ["funk-blast", "Funk Blast", "灯亮了，压轴的节拍也到了。", "EPIC", 1, "FunkBlast"],
].map(([code, name, description, rarity, weight, animationClip], index) => ({
  code: code as string,
  name: name as string,
  description: description as string,
  rarity: rarity as BlindboxRarity,
  weight: weight as number,
  displayOrder: (index + 1) * 10,
  animationClip: animationClip as string,
}));

export const fallbackSeries: BlindboxSeries[] = [
  {
    code: "daily",
    name: "日常小确幸",
    description: "十二种慢慢生活的庞菠菠。",
    theme: "DAILY",
    variants: dailyVariants,
  },
  {
    code: "hiphop",
    name: "节拍实验室",
    description: "十二段跟着节拍醒来的动作。",
    theme: "HIPHOP",
    variants: hiphopVariants,
  },
];

const rarityValues = new Set<BlindboxRarity>(["COMMON", "UNCOMMON", "RARE", "EPIC"]);

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function normalizeVariant(value: unknown, index: number): BlindboxVariant | null {
  const record = objectValue(value);
  if (!record || record.enabled === false) return null;
  const code = asString(record.code);
  const name = asString(record.name);
  const animationClip = asString(record.animationClip ?? record.animation, code);
  const rarityCandidate = asString(record.rarity, "COMMON").toUpperCase() as BlindboxRarity;
  const rarity = rarityValues.has(rarityCandidate) ? rarityCandidate : "COMMON";
  const weight = typeof record.weight === "number" ? Math.max(0, record.weight) : 1;
  if (!code || !name || !animationClip || weight <= 0) return null;
  return {
    code,
    name,
    description: asString(record.description, "庞菠菠的一枚小小瞬间。"),
    rarity,
    weight,
    displayOrder: typeof record.displayOrder === "number" ? record.displayOrder : index * 10,
    animationClip,
  };
}

function normalizeSeries(value: unknown): BlindboxSeries | null {
  const release = objectValue(value);
  if (!release) return null;
  const content = objectValue(release.content) ?? release;
  const code = asString(content.code ?? content.seriesCode ?? release.seriesCode);
  const variantsRaw = Array.isArray(content.variants) ? content.variants : [];
  const variants = variantsRaw
    .map(normalizeVariant)
    .filter((variant): variant is BlindboxVariant => variant !== null)
    .sort((left, right) => left.displayOrder - right.displayOrder);
  if (!code || variants.length === 0 || content.enabled === false) return null;
  return {
    code,
    name: asString(content.name, code === "daily" ? "日常小确幸" : "节拍实验室"),
    description: asString(content.description, "庞菠菠的限时小剧场。"),
    theme: asString(content.theme, code === "daily" ? "DAILY" : "HIPHOP"),
    version: typeof release.version === "number"
      ? release.version
      : typeof content.publishedVersion === "number" ? content.publishedVersion : undefined,
    modelAssetKey: asString(content.modelAssetKey) || undefined,
    variants,
  };
}

function unwrapApi(value: unknown): unknown {
  const record = objectValue(value);
  if (!record) return value;
  return record.code === 0 && "data" in record ? record.data : value;
}

function seriesCandidates(value: unknown): unknown[] {
  const data = unwrapApi(value);
  if (Array.isArray(data)) return data;
  const record = objectValue(data);
  if (!record) return [];
  if (Array.isArray(record.series)) return record.series;
  if (Array.isArray(record.releases)) return record.releases;
  if (record.manifest) return seriesCandidates(record.manifest);
  return [record];
}

async function requestJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json() as Promise<unknown>;
}

export async function loadBlindboxManifest(): Promise<BlindboxManifest> {
  try {
    const aggregate = await requestJson("/api/public/blindbox");
    const series = seriesCandidates(aggregate)
      .map(normalizeSeries)
      .filter((item): item is BlindboxSeries => item !== null);
    if (series.length > 0) return { source: "published", series };
  } catch {
    // Some backend revisions expose the aggregate behind /current.
  }

  try {
    const aggregate = await requestJson("/api/public/blindbox/current");
    const series = seriesCandidates(aggregate)
      .map(normalizeSeries)
      .filter((item): item is BlindboxSeries => item !== null);
    if (series.length > 0) return { source: "published", series };
  } catch {
    // Older backends only expose a current-release endpoint per series.
  }

  try {
    const releases = await Promise.allSettled(
      ["daily", "hiphop"].map((code) => requestJson(`/api/public/blindbox/series/${code}/current`)),
    );
    const series = releases
      .filter((result): result is PromiseFulfilledResult<unknown> => result.status === "fulfilled")
      .flatMap((result) => seriesCandidates(result.value))
      .map(normalizeSeries)
      .filter((item): item is BlindboxSeries => item !== null);
    if (series.length > 0) return { source: "series", series };
  } catch {
    // A local read-only manifest keeps the public page usable before first publish.
  }

  return { source: "fallback", series: fallbackSeries };
}

export function pickWeightedVariant(variants: BlindboxVariant[]) {
  const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
  let position = Math.random() * totalWeight;
  for (const variant of variants) {
    position -= variant.weight;
    if (position <= 0) return variant;
  }
  return variants[variants.length - 1];
}
