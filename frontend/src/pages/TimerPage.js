import { useEffect, useMemo, useRef, useState } from "react";
import { fetchSessions, endSession, pauseSession, resumeSession, startSession } from "../api/sessions";
import { fetchSubjects } from "../api/subjects";
import { formatDateTime, formatDuration } from "../utils/format";

const AUTO_PAUSE_DELAY_MS = 30 * 1000;
const DEFAULT_TITLE = "스터디 트래커";
const AUTO_PAUSE_TITLE = "타이머 자동 일시정지";

function buildAlertFaviconUrl(isActive) {
  const fillColor = isActive ? "#dc2626" : "#f59e0b";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="16" fill="#ffffff" />
      <circle cx="32" cy="32" r="14" fill="${fillColor}" />
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function translateStatus(status) {
  if (status === "active") {
    return "공부 중";
  }

  if (status === "paused") {
    return "일시 정지 중";
  }

  if (status === "completed") {
    return "완료";
  }

  return "공부 시작 전";
}

function TimerPage() {
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [memo, setMemo] = useState("");
  const [tick, setTick] = useState(Date.now());
  const [message, setMessage] = useState("");
  const [autoPauseNotice, setAutoPauseNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const hiddenTimeoutRef = useRef(null);
  const currentSessionRef = useRef(null);
  const memoRef = useRef("");
  const autoPauseInFlightRef = useRef(false);
  const defaultFaviconHrefRef = useRef("");

  const currentSession = useMemo(
    () =>
      sessions.find(
        (session) => !session.end_time && (session.status === "active" || session.status === "paused")
      ) || null,
    [sessions]
  );

  useEffect(() => {
    async function loadData() {
      try {
        const [subjectData, sessionData] = await Promise.all([fetchSubjects(), fetchSessions()]);
        setSubjects(subjectData.subjects);
        setSessions(sessionData.sessions);
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!currentSession) {
      return;
    }

    if (currentSession.subject_id) {
      setSubjectId(String(currentSession.subject_id));
    }

    setMemo(currentSession.memo || "");
  }, [currentSession]);

  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  useEffect(() => {
    memoRef.current = memo;
  }, [memo]);

  useEffect(() => {
    if (!currentSession || currentSession.status !== "active") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [currentSession]);

  useEffect(() => {
    const iconLink =
      document.querySelector("link[rel='icon']") ||
      document.querySelector("link[rel='shortcut icon']");

    if (iconLink && !defaultFaviconHrefRef.current) {
      defaultFaviconHrefRef.current = iconLink.getAttribute("href") || "";
    }

    if (autoPauseNotice) {
      document.title = `${AUTO_PAUSE_TITLE} | ${DEFAULT_TITLE}`;

      if (iconLink) {
        iconLink.setAttribute("href", buildAlertFaviconUrl(true));
      }
    } else {
      document.title = DEFAULT_TITLE;

      if (iconLink) {
        iconLink.setAttribute("href", defaultFaviconHrefRef.current || "/favicon.ico");
      }
    }

    return () => {
      document.title = DEFAULT_TITLE;

      if (iconLink) {
        iconLink.setAttribute("href", defaultFaviconHrefRef.current || "/favicon.ico");
      }
    };
  }, [autoPauseNotice]);

  useEffect(() => {
    function clearHiddenTimeout() {
      if (hiddenTimeoutRef.current) {
        window.clearTimeout(hiddenTimeoutRef.current);
        hiddenTimeoutRef.current = null;
      }
    }

    async function autoPauseIfNeeded() {
      const session = currentSessionRef.current;

      if (!session || session.status !== "active" || session.end_time || autoPauseInFlightRef.current) {
        return;
      }

      autoPauseInFlightRef.current = true;
      setLoading(true);

      try {
        await pauseSession({ memo: memoRef.current });
        await refreshSessions();
        setAutoPauseNotice("탭을 30초 이상 벗어나 타이머가 자동으로 일시정지되었습니다.");
      } catch (error) {
        setMessage(error.message);
      } finally {
        autoPauseInFlightRef.current = false;
        setLoading(false);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        clearHiddenTimeout();
        hiddenTimeoutRef.current = window.setTimeout(() => {
          hiddenTimeoutRef.current = null;
          void autoPauseIfNeeded();
        }, AUTO_PAUSE_DELAY_MS);
        return;
      }

      clearHiddenTimeout();
    }

    if (!currentSession || currentSession.status !== "active") {
      clearHiddenTimeout();
      return undefined;
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    handleVisibilityChange();

    return () => {
      clearHiddenTimeout();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentSession]);

  function getElapsedSeconds(session) {
    if (!session) {
      return 0;
    }

    const duration = Number(session.duration || 0);

    if (session.status !== "active" || session.end_time) {
      return duration;
    }

    const activeSince = new Date(session.last_resume_time || session.start_time).getTime();
    const extra = Math.max(0, Math.floor((tick - activeSince) / 1000));

    return duration + extra;
  }

  async function refreshSessions() {
    const data = await fetchSessions();
    setSessions(data.sessions);
  }

  async function handleStart() {
    setLoading(true);
    setMessage("");
    setAutoPauseNotice("");

    try {
      await startSession({
        subjectId: subjectId ? Number(subjectId) : null,
        memo
      });
      await refreshSessions();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePause() {
    setLoading(true);
    setMessage("");
    setAutoPauseNotice("");

    try {
      await pauseSession({ memo });
      await refreshSessions();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResume() {
    setLoading(true);
    setMessage("");
    setAutoPauseNotice("");

    try {
      await resumeSession({ memo });
      await refreshSessions();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    setLoading(true);
    setMessage("");
    setAutoPauseNotice("");

    try {
      await endSession({
        sessionId: currentSession?.id || null,
        memo
      });
      await refreshSessions();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function getPrimaryAction() {
    if (!currentSession) {
      return {
        label: "시작",
        onClick: handleStart
      };
    }

    if (currentSession.status === "active") {
      return {
        label: "일시정지",
        onClick: handlePause
      };
    }

    if (currentSession.status === "paused") {
      return {
        label: "재시작",
        onClick: handleResume
      };
    }

    return {
      label: "시작",
      onClick: handleStart
    };
  }

  const primaryAction = getPrimaryAction();

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h1>공부 타이머</h1>
          <p>공부 시간을 기록할 수 있습니다.</p>
        </div>
      </div>

      {autoPauseNotice ? (
        <div className="notice-banner">
          <span>{autoPauseNotice}</span>
          <button className="notice-banner-close" type="button" onClick={() => setAutoPauseNotice("")}>
            닫기
          </button>
        </div>
      ) : null}

      <div className="split-section">
        <div className="section-box">
          <h2 className="section-title">타이머</h2>
          <div className="timer-display">{formatDuration(getElapsedSeconds(currentSession))}</div>
          <div className="list-block">
            <div className="list-item">상태: {translateStatus(currentSession?.status)}</div>
            <div className="list-item">시작 시각: {formatDateTime(currentSession?.start_time)}</div>
          </div>
        </div>

        <div className="section-box">
          <h2 className="section-title">세션 설정</h2>
          <div className="form-block">
            <label className="field-label" htmlFor="timer-subject">
              과목
            </label>
            <select id="timer-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
              <option value="">과목 없음</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <label className="field-label" htmlFor="timer-memo">
              메모
            </label>
            <input
              id="timer-memo"
              type="text"
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="메모"
            />
          </div>

          <div className="button-row">
            <button className="primary-button" type="button" onClick={primaryAction.onClick} disabled={loading}>
              {primaryAction.label}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handleEnd}
              disabled={loading || !currentSession}
            >
              종료
            </button>
          </div>
        </div>
      </div>

      {message ? <div className="status-text">{message}</div> : null}
    </div>
  );
}

export default TimerPage;
