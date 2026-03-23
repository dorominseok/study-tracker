import { request } from "./client";

function fetchDailyStatistics() {
  return request("/statistics/daily");
}

function fetchWeeklyStatistics() {
  return request("/statistics/weekly");
}

export { fetchDailyStatistics, fetchWeeklyStatistics };
