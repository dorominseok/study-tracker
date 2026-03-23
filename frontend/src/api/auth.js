import { request } from "./client";
import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
  isAuthenticated,
  saveAuthSession
} from "./authStorage";

async function login(credentials) {
  const data = await request("/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });

  saveAuthSession(data);
  return data;
}

async function register(credentials) {
  const data = await request("/register", {
    method: "POST",
    body: JSON.stringify(credentials)
  });

  saveAuthSession(data);
  return data;
}

export {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
  isAuthenticated,
  login,
  register,
  saveAuthSession
};
