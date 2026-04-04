import { clearAuthSession, getAuthToken } from "./authStorage";

const API_BASE_URL = "http://localhost:4000";

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      // 401 응답은 세션 만료로 보고 저장된 인증 정보를 지운다.
      clearAuthSession();
    }

    throw new Error(data?.message || "Request failed.");
  }

  return data;
}

export { API_BASE_URL, request };
