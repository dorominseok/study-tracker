import { useEffect, useState } from "react";
import { fetchDailyGoal, saveDailyGoal } from "../api/dailyGoal";

function DailyGoalPage() {
  const [targetMinutes, setTargetMinutes] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadGoal() {
      try {
        const data = await fetchDailyGoal();
        setTargetMinutes(data.goal?.target_minutes ? String(data.goal.target_minutes) : "");
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadGoal();
  }, []);

  async function handleSave() {
    setLoading(true);
    setMessage("");

    try {
      const data = await saveDailyGoal(Number(targetMinutes));
      setTargetMinutes(String(data.goal?.target_minutes || targetMinutes));
      setMessage(data.message || "Saved");
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

      {message ? <div className="status-text">{message}</div> : null}
    </div>
  );
}

export default DailyGoalPage;
