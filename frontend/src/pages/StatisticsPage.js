import { useEffect, useMemo, useState } from "react";
import { fetchDailyStatistics, fetchWeeklyStatistics } from "../api/statistics";
import { formatDuration } from "../utils/format";

function toDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatChartValue(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }

  return `${minutes}분`;
}

function StatisticsPage() {
  const [dailyTotal, setDailyTotal] = useState(0);
  const [weeklyRows, setWeeklyRows] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadStatistics() {
      try {
        const [dailyData, weeklyData] = await Promise.all([
          fetchDailyStatistics(),
          fetchWeeklyStatistics()
        ]);

        setDailyTotal(dailyData.totalSeconds);
        setWeeklyRows(weeklyData);
        setMessage("");
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadStatistics();
  }, []);

  const weeklyChartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 공부 기록이 없는 날도 포함해서 최근 7일을 항상 같은 길이의 차트 데이터로 맞춘다.
    const totalsByDay = new Map(
      weeklyRows.map((row) => [String(row.day).slice(0, 10), Number(row.totalSeconds || 0)])
    );

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));

      return {
        key: toDayKey(date),
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        weekday: date.toLocaleDateString("ko-KR", { weekday: "short" }),
        totalSeconds: totalsByDay.get(toDayKey(date)) || 0
      };
    });
  }, [weeklyRows]);

  const maxWeeklySeconds = useMemo(
    () => Math.max(...weeklyChartData.map((row) => row.totalSeconds), 0),
    [weeklyChartData]
  );

  const weeklyAverageSeconds = useMemo(() => {
    if (weeklyChartData.length === 0) {
      return 0;
    }

    const totalSeconds = weeklyChartData.reduce((sum, row) => sum + row.totalSeconds, 0);

    return Math.floor(totalSeconds / weeklyChartData.length);
  }, [weeklyChartData]);

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h1>통계</h1>
          <p>오늘 공부 시간과 최근 7일 공부 시간을 확인할 수 있습니다.</p>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-box">
          <span className="metric-label">오늘 공부 시간</span>
          <div className="metric-value">{formatDuration(dailyTotal)}</div>
        </div>
        <div className="metric-box">
          <span className="metric-label">최근 7일 평균 공부 시간</span>
          <div className="metric-value">{formatDuration(weeklyAverageSeconds)}</div>
        </div>
      </div>

      <div className="section-box">
        <h2 className="section-title">최근 7일 공부 그래프</h2>
        <div className="weekly-chart">
          {weeklyChartData.map((row) => {
            const ratio = maxWeeklySeconds > 0 ? row.totalSeconds / maxWeeklySeconds : 0;
            // 값이 아주 작아도 막대가 완전히 사라지지 않도록 최소 높이를 둔다.
            const height = row.totalSeconds > 0 ? Math.max(ratio * 180, 14) : 8;

            return (
              <div key={row.key} className="chart-column">
                <div className="chart-value">{formatChartValue(row.totalSeconds)}</div>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ height: `${height}px` }} />
                </div>
                <div className="chart-label">{row.label}</div>
                <div className="chart-sub-label">{row.weekday}</div>
              </div>
            );
          })}
        </div>
      </div>

      {message ? <div className="status-text">{message}</div> : null}
    </div>
  );
}

export default StatisticsPage;
