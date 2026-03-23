import { useEffect, useState } from "react";
import { fetchSessions } from "../api/sessions";
import { formatDateTime, formatDuration } from "../utils/format";

function translateStatus(status) {
  if (status === "active") {
    return "진행 중";
  }

  if (status === "paused") {
    return "일시정지";
  }

  if (status === "completed") {
    return "완료";
  }

  return status || "-";
}

function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await fetchSessions();
        setSessions(data.sessions);
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadSessions();
  }, []);

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h1>기록</h1>
          <p>완료된 세션과 진행 중인 세션 기록을 시간 순서대로 확인합니다.</p>
        </div>
      </div>

      <div className="section-box">
        <h2 className="section-title">세션 목록</h2>
        <div className="list-block">
          {sessions.map((session) => (
            <div key={session.id} className="list-item">
              #{session.id} | {translateStatus(session.status)} | {formatDuration(session.duration)} |{" "}
              {formatDateTime(session.start_time)}
            </div>
          ))}
        </div>
      </div>

      {message ? <div className="status-text">{message}</div> : null}
    </div>
  );
}

export default HistoryPage;
