import type { ApiResponse, Series } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() ?? "GET";
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !readCookie("XSRF-TOKEN")) {
    await establishAdminSession();
  }
  const csrfToken = readCookie("XSRF-TOKEN");
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-XSRF-TOKEN": decodeURIComponent(csrfToken) } : {}),
      ...init?.headers
    }
  });

  if (response.status === 401 || response.status === 403) {
    window.location.assign(`/manage/login?next=${encodeURIComponent(window.location.href)}`);
    throw new Error("管理员登录已失效");
  }
  if (!response.ok) throw new Error(`请求失败（${response.status}）`);

  const body = (await response.json()) as ApiResponse<T>;
  if (body.code !== 0) throw new Error("后台返回了未处理的错误");
  return body.data;
}

function readCookie(name: string) {
  return document.cookie.split("; ").find((entry) => entry.startsWith(`${name}=`))?.slice(name.length + 1);
}

async function establishAdminSession() {
  const response = await fetch("/api/admin/blindbox/session", { credentials: "include" });
  if (response.status === 401 || response.status === 403) {
    window.location.assign(`/manage/login?next=${encodeURIComponent(window.location.href)}`);
    throw new Error("请先登录管理后台");
  }
  if (!response.ok) throw new Error("无法建立管理会话");
}

export const blindboxApi = {
  listSeries: () => request<Series[]>("/api/admin/blindbox/series"),
  publish: (seriesId: number) =>
    request<{ releaseId: number; version: number }>(`/api/admin/blindbox/series/${seriesId}/publish`, {
      method: "POST",
      body: "{}"
    })
};
