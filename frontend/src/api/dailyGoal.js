import { request } from "./client";

function fetchDailyGoal() {
  return request("/daily-goal");
}

function saveDailyGoal(targetMinutes) {
  return request("/daily-goal", {
    method: "PUT",
    body: JSON.stringify({ targetMinutes })
  });
}

export { fetchDailyGoal, saveDailyGoal };
