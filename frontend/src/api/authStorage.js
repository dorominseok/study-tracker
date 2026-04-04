const TOKEN_KEY = "study_tracker_token";
const USER_KEY = "study_tracker_user";

function saveAuthSession(data) {
  if (data?.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }

  if (data?.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
}

function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function getAuthUser() {
  const stored = localStorage.getItem(USER_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    // 저장된 사용자 정보가 손상된 경우 앱이 깨지지 않도록 null을 반환한다.
    return null;
  }
}

function isAuthenticated() {
  return Boolean(getAuthToken());
}

export { clearAuthSession, getAuthToken, getAuthUser, isAuthenticated, saveAuthSession };
