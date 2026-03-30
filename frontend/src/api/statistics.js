import { request } from "./client";

function fetchDailyStatistics() {
  return request("/statistics/daily");
}

function fetchWeeklyStatistics() {
  return request("/statistics/weekly");
}

function fetchHeatmapStatistics(year, month) {
  const params = new URLSearchParams();

  if (year) {
    params.set("year", String(year));
  }

  if (month) {
    params.set("month", String(month));
  }

  const query = params.toString();

  return request(`/statistics/heatmap${query ? `?${query}` : ""}`);
}

export { fetchDailyStatistics, fetchHeatmapStatistics, fetchWeeklyStatistics };
