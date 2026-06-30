const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { token, ...customConfig } = options;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  let authToken = token;
  
  if (!authToken && typeof window === "undefined") {
    try {
      const { auth } = await import("@/auth");
      const session = await auth();
      if ((session as any)?.accessToken) {
        authToken = (session as any).accessToken;
      }
    } catch (e) {
      console.error("Failed to retrieve server session in API client", e);
    }
  }
  
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  const config = {
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };
  
  const cleanEndpoint = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
  const response = await fetch(`${API_URL}${cleanEndpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Something went wrong");
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    return fetchAPI(endpoint, { ...options, method: "GET" });
  },
  post: <T>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<T> => {
    return fetchAPI(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  patch: <T>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<T> => {
    return fetchAPI(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  delete: <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    return fetchAPI(endpoint, { ...options, method: "DELETE" });
  },
};
