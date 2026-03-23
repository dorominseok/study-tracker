import { useEffect, useState } from "react";
import { fetchDailyStatistics, fetchWeeklyStatistics } from "../api/statistics";
import { formatDuration } from "../utils/format";

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
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadStatistics();
  }, []);

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h1>통계</h1>
          <p></p>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-box">
          <span className="metric-label">오늘 공부 시간</span>
          <div className="metric-value">{formatDuration(dailyTotal)}</div>
        </div>
      </div>

      <div className="section-box">
        <h2 className="section-title">기록</h2>
        <div className="list-block">
          {weeklyRows.map((row) => (
            <div key={row.day} className="list-item">
              {row.day} - {formatDuration(row.totalSeconds)}
            </div>
          ))}
        </div>
      </div>

      {message ? <div className="status-text">{message}</div> : null}
    </div>
  );
}

export default StatisticsPage;
