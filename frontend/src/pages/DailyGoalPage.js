import { useEffect, useState } from "react";
import { fetchDailyGoal, fetchDailyGoalHistory, saveDailyGoal } from "../api/dailyGoal";

function formatHistoryDate(day) {
  const [year, month, date] = String(day).split("-");

  if (!year || !month || !date) {
    return String(day);
  }

  return `${month}/${date}`;
}

function DailyGoalPage() {
  const [targetMinutes, setTargetMinutes] = useState("");
  const [goalHistory, setGoalHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadPageData() {
    try {
      // 현재 목표와 최근 목표 기록을 함께 불러와 페이지 초기 상태를 한 번에 맞춘다.
      const [goalData, historyData] = await Promise.all([
        fetchDailyGoal(),
        fetchDailyGoalHistory()
      ]);

      setTargetMinutes(goalData.goal?.target_minutes ? String(goalData.goal.target_minutes) : "");
      setGoalHistory(historyData.goals || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadPageData();
  }, []);

  async function handleSave() {
    setLoading(true);
    setMessage("");

    try {
      const data = await saveDailyGoal(Number(targetMinutes));
      setTargetMinutes(String(data.goal?.target_minutes || targetMinutes));
      setMessage(data.message || "저장되었습니다.");
      await loadPageData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h1>일일 목표</h1>
          <p>오늘 공부할 목표 시간을 분 단위로 저장할 수 있습니다.</p>
        </div>
      </div>

      <div className="section-box">
        <div className="split-section">
          <div>
            <h2 className="section-title">목표 설정</h2>
            <div className="form-block">
              <label className="field-label" htmlFor="goal-minutes">
                목표 시간(분)
              </label>
              <input
                id="goal-minutes"
                type="number"
                value={targetMinutes}
                onChange={(event) => setTargetMinutes(event.target.value)}
                placeholder="목표 시간(분)"
              />
              <button className="primary-button" type="button" onClick={handleSave} disabled={loading}>
                목표 저장
              </button>
            </div>
          </div>

          <div>
            <h2 className="section-title">목표 기록</h2>
            <div className="goal-history-header">
              <span>날짜</span>
              <span>목표 시간</span>
              <span>완료 여부</span>
            </div>
            <div className="list-block">
              {goalHistory.length > 0 ? (
                goalHistory.map((goal) => (
                  <div key={goal.day} className="goal-history-row">
                    <span>{formatHistoryDate(goal.day)}</span>
                    <span>{goal.targetMinutes}분</span>
                    <span className={goal.completed ? "goal-status-success" : "goal-status-pending"}>
                      {goal.completed ? "성공" : "실패"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="status-text">표시할 목표 기록이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {message ? <div className="status-text">{message}</div> : null}
    </div>
  );
}

export default DailyGoalPage;
