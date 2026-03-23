import { request } from "./client";

function fetchSessions() {
  return request("/sessions");
}

function startSession(payload) {
  return request("/sessions/start", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function pauseSession(payload) {
  return request("/sessions/pause", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function resumeSession(payload) {
  return request("/sessions/resume", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function endSession(payload) {
  return request("/sessions/end", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export { endSession, fetchSessions, pauseSession, resumeSession, startSession };
