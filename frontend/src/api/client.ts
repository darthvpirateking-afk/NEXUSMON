export function resolveApiBaseUrl(
  configuredBaseUrl: string | undefined,
  currentOrigin?: string,
  isDev: boolean = Boolean(import.meta.env.DEV),
): string {
  const normalized = (configuredBaseUrl ?? "https://nexusmon.onrender.com").replace(/\/+$/, "");
  if (!isDev) {
    return normalized;
  }

  try {
    const url = new URL(normalized);
    const isLocalBackend =
      (url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
      url.port === "8000";
    if (isLocalBackend && currentOrigin && currentOrigin !== url.origin) {
      return "";
    }
  } catch {
    return normalized;
  }

  return normalized;
}

const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL,
  typeof window !== "undefined" ? window.location.origin : undefined,
);

export class ApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string) {
    super(`Request failed (${status}) for ${path}`);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
  }
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const operatorKey = import.meta.env.VITE_OPERATOR_KEY;
  if (operatorKey && operatorKey.trim() !== "") {
    headers["x-operator-key"] = operatorKey;
  }
  return headers;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: buildHeaders(),
  });
  if (!response.ok) {
    throw new ApiError(response.status, path);
  }
  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(response.status, path);
  }
  return (await response.json()) as T;
}
