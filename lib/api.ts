// Typed API client — reads JWT from localStorage, proxied to backend via /api/*

export interface Source {
  id: string;
  name: string;
  url?: string;
  category?: string;
  country?: string;
  language?: string;
  provider: string;
}

export interface Article {
  id: string;
  title: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
  canonicalUrl: string;
  tags: string[];
  provider: string;
  source?: Source;
  _score?: number;
}

export interface FeedResponse {
  page: number;
  limit: number;
  articles: Article[];
  q?: string;
}

export interface Preferences {
  id: string;
  userId: string;
  preferredLanguages: string[];
  preferredCategories: string[];
  preferredSources: string[];
  preferredKeywords: string[];
  blockedKeywords: string[];
  country: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Fastify can return 400 for empty JSON bodies when Content-Type is set.
  // Only set JSON content type when a body is actually provided.
  if (options.body !== undefined && options.body !== null && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; userId: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    apiFetch<{ token: string; userId: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

// ── Feed ──────────────────────────────────────────────────────────────────
export const feedApi = {
  home: (page = 1, refresh = false) =>
    apiFetch<FeedResponse>(`/feed/home?page=${page}&limit=20${refresh ? '&refresh=true' : ''}`),
  latest: (page = 1, refresh = false) =>
    apiFetch<FeedResponse>(`/feed/latest?page=${page}&limit=20${refresh ? '&refresh=true' : ''}`),
  trending: (page = 1) =>
    apiFetch<FeedResponse>(`/feed/trending?page=${page}&limit=20`),
  search: (q: string, page = 1) =>
    apiFetch<FeedResponse>(
      `/feed/search?q=${encodeURIComponent(q)}&page=${page}&limit=20`
    ),
  sources: () =>
    apiFetch<{ sources: Source[] }>("/feed/sources"),
};

// ── Articles ──────────────────────────────────────────────────────────────
export const articleApi = {
  markRead: (id: string) =>
    apiFetch<{ ok: boolean }>(`/articles/${id}/read`, { method: "POST" }),
  hide: (id: string) =>
    apiFetch<{ ok: boolean }>(`/articles/${id}/hide`, { method: "POST" }),
  save: (id: string) =>
    apiFetch<{ ok: boolean }>(`/saved/${id}`, { method: "POST" }),
  unsave: (id: string) =>
    apiFetch<{ ok: boolean }>(`/saved/${id}`, { method: "DELETE" }),
  saved: () =>
    apiFetch<FeedResponse>("/saved"),
};

// ── Preferences ───────────────────────────────────────────────────────────
export const prefsApi = {
  get: () => apiFetch<Preferences>("/preferences"),
  update: (data: Partial<Omit<Preferences, "id" | "userId">>) =>
    apiFetch<Preferences>("/preferences", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
