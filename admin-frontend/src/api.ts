import type {
  AnimationQa,
  ApiResponse,
  Asset,
  AssetUpdateInput,
  DialogueIntent,
  DialogueOverview,
  DialogueReply,
  DialogueTrigger,
  QaStatus,
  Release,
  RequestDetail,
  RequestLog,
  Series,
  SeriesInput,
  UnmatchedUtterance,
  VariantInput
} from "./types";

const API_ROOT = "/api/admin/blindbox";

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function requestFrom<T>(root: string, path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  if (!isSafeMethod(method) && !readCookie("XSRF-TOKEN")) await establishAdminSession();

  const csrfToken = readCookie("XSRF-TOKEN");
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (csrfToken) headers.set("X-XSRF-TOKEN", decodeURIComponent(csrfToken));

  const response = await fetch(`${root}${path}`, { credentials: "include", ...init, headers });
  if (response.status === 401 || response.status === 403) {
    redirectToLogin();
    throw new ApiError("管理员登录已失效", response.status);
  }

  const body = await readBody<T>(response);
  if (!response.ok) {
    const message = isEnvelope(body) ? body.message : undefined;
    throw new ApiError(message || `请求失败（${response.status}）`, response.status);
  }
  if (isEnvelope<T>(body)) {
    if (body.code !== 0) throw new ApiError(body.message || "后台返回了未处理的错误", response.status);
    return body.data;
  }
  return body as T;
}

const request = <T,>(path: string, init: RequestInit = {}) => requestFrom<T>(API_ROOT, path, init);

async function readBody<T>(response: Response): Promise<ApiResponse<T> | T | null> {
  if (response.status === 204) return null;
  if (!(response.headers.get("content-type") ?? "").includes("json")) return null;
  return response.json() as Promise<ApiResponse<T> | T>;
}

function isEnvelope<T>(value: unknown): value is ApiResponse<T> {
  return Boolean(value && typeof value === "object" && "code" in value && "data" in value);
}
function isSafeMethod(method: string) { return ["GET", "HEAD", "OPTIONS"].includes(method); }
function readCookie(name: string) { return document.cookie.split("; ").find((entry) => entry.startsWith(`${name}=`))?.slice(name.length + 1); }
function redirectToLogin() { window.location.assign(`/manage/login?next=${encodeURIComponent(window.location.href)}`); }

async function establishAdminSession() {
  const response = await fetch(`${API_ROOT}/session`, { credentials: "include" });
  if (response.status === 401 || response.status === 403) {
    redirectToLogin();
    throw new ApiError("请先登录管理后台", response.status);
  }
  if (!response.ok) throw new ApiError("无法建立管理会话", response.status);
}

const json = (value: unknown) => JSON.stringify(value);

export const blindboxApi = {
  establishSession: establishAdminSession,
  listSeries: () => request<Series[]>("/series"),
  createSeries: (input: SeriesInput) => request<Series>("/series", { method: "POST", body: json(input) }),
  updateSeries: (id: number, input: SeriesInput) => request<Series>(`/series/${id}`, { method: "PUT", body: json(input) }),
  deleteSeries: (id: number) => request<void>(`/series/${id}`, { method: "DELETE" }),
  createVariant: (seriesId: number, input: VariantInput) =>
    request<VariantInput & { id: number }>(`/series/${seriesId}/variants`, { method: "POST", body: json(input) }),
  updateVariant: (seriesId: number, id: number, input: VariantInput) =>
    request<VariantInput & { id: number }>(`/series/${seriesId}/variants/${id}`, { method: "PUT", body: json(input) }),
  deleteVariant: (seriesId: number, id: number) => request<void>(`/series/${seriesId}/variants/${id}`, { method: "DELETE" }),
  listAssets: () => request<Asset[]>("/assets"),
  uploadAsset: (file: File, kind: Asset["kind"]) => {
    const body = new FormData();
    body.append("file", file);
    body.append("kind", kind);
    return request<Asset>("/assets", { method: "POST", body });
  },
  updateAsset: (id: number, input: AssetUpdateInput) =>
    request<Asset>(`/assets/${id}`, { method: "PUT", body: json(input) }),
  deleteAsset: (id: number) => request<void>(`/assets/${id}`, { method: "DELETE" }),
  listMotions: () => request<AnimationQa[]>("/motions"),
  reviewMotion: (id: number, qaStatus: QaStatus, notes: string) =>
    request<AnimationQa>(`/motions/${id}/qa`, { method: "PATCH", body: json({ qaStatus, notes }) }),
  listReleases: (seriesId?: number) => request<Release[]>(`/releases${seriesId ? `?seriesId=${seriesId}` : ""}`),
  publish: (seriesId: number, note: string) => request<Release>(`/series/${seriesId}/publish`, { method: "POST", body: json({ note }) }),
  rollback: (releaseId: number) => request<Release>(`/releases/${releaseId}/rollback`, { method: "POST", body: "{}" })
};

const DIALOGUE_ROOT = "/api/admin/dialogue";
const dialogueRequest = <T,>(path: string, init: RequestInit = {}) => requestFrom<T>(DIALOGUE_ROOT, path, init);

export const dialogueApi = {
  overview: () => dialogueRequest<DialogueOverview>("/overview"),
  listIntents: () => dialogueRequest<DialogueIntent[]>("/intents"),
  createIntent: (input: Omit<DialogueIntent, "id" | "updatedAt" | "triggers" | "replies">) => dialogueRequest<DialogueIntent>("/intents", { method: "POST", body: json(input) }),
  updateIntent: (id: number, input: Omit<DialogueIntent, "id" | "updatedAt" | "triggers" | "replies">) => dialogueRequest<DialogueIntent>(`/intents/${id}`, { method: "PUT", body: json(input) }),
  deleteIntent: (id: number) => dialogueRequest<void>(`/intents/${id}`, { method: "DELETE" }),
  createTrigger: (intentId: number, input: Omit<DialogueTrigger, "id">) => dialogueRequest<DialogueTrigger>(`/intents/${intentId}/triggers`, { method: "POST", body: json(input) }),
  updateTrigger: (intentId: number, id: number, input: Omit<DialogueTrigger, "id">) => dialogueRequest<DialogueTrigger>(`/intents/${intentId}/triggers/${id}`, { method: "PUT", body: json(input) }),
  deleteTrigger: (intentId: number, id: number) => dialogueRequest<void>(`/intents/${intentId}/triggers/${id}`, { method: "DELETE" }),
  createReply: (intentId: number, input: Omit<DialogueReply, "id">) => dialogueRequest<DialogueReply>(`/intents/${intentId}/replies`, { method: "POST", body: json(input) }),
  updateReply: (intentId: number, id: number, input: Omit<DialogueReply, "id">) => dialogueRequest<DialogueReply>(`/intents/${intentId}/replies/${id}`, { method: "PUT", body: json(input) }),
  deleteReply: (intentId: number, id: number) => dialogueRequest<void>(`/intents/${intentId}/replies/${id}`, { method: "DELETE" }),
  listUnmatched: () => dialogueRequest<UnmatchedUtterance[]>("/unmatched"),
  resolveUnmatched: (id: number, resolved: boolean) => dialogueRequest<UnmatchedUtterance>(`/unmatched/${id}`, { method: "PATCH", body: json({ resolved }) }),
  listRequests: () => dialogueRequest<RequestLog[]>("/requests"),
  requestDetail: (id: string) => dialogueRequest<RequestDetail>(`/requests/${id}`),
};

export { ApiError };
