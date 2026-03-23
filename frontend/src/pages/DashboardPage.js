import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthUser, isAuthenticated } from "../api/auth";
import FeatureBox from "../components/FeatureBox";
import { fetchDailyGoal } from "../api/dailyGoal";
import { fetchSessions } from "../api/sessions";
import { fetchDailyStatistics } from "../api/statistics";
import { formatDuration } from "../utils/format";

function DashboardPage() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [user, setUser] = useState(getAuthUser());
  const [summary, setSummary] = useState({
    totalSeconds: 0,
    goalMinutes: null,
    currentStatus: "로그인 후 확인 가능"
  });
  const [message, setMessage] = useState("");

  const featureItems = useMemo(
    () => [
      {
        title: "공부 타이머",
        description: "공부를 시작해보세요.",
        path: "/timer"
      },
      {
        title: "과목 관리",
        description: "공부할 과목을 추가해보세요.",
        path: "/subjects"
      },
      {
        title: "일일 목표",
        description: "목표 공부 시간을 설정해보세요.",
        path: "/goal"
      },
      {
        title: "통계",
        description: "공부 시간을 확인해보세요.",
        path: "/statistics"
      }
    ],
    []
  );

  useEffect(() => {
    if (!authenticated) {
      setSummary({
        totalSeconds: 0,
        goalMinutes: null,
        currentStatus: "로그인 후 확인 가능"
      });
      setMessage("");
      return;
    }

    async function loadSummary() {
      try {
        const [dailyData, goalData, sessionData] = await Promise.all([
          fetchDailyStatistics(),
          fetchDailyGoal(),
          fetchSessions()
        ]);

        const currentSession = sessionData.sessions.find(
          (session) => !session.end_time && (session.status === "active" || session.status === "paused")
        );

        setSummary({
          totalSeconds: dailyData.totalSeconds,
          goalMinutes: goalData.goal?.target_minutes ?? null,
          currentStatus: currentSession
            ? currentSession.status === "active"
              ? "공부중"
              : "잠시 쉬는중"
            : "공부 시작 전"
        });
        setMessage("");
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadSummary();
  }, [authenticated]);

  function handleFeatureNavigate(path) {
    if (authenticated) {
      navigate(path);
      return;
    }

    navigate("/login", { state: { from: path } });
  }

  function handleLogout() {
    clearAuthSession();
    setAuthenticated(false);
    setUser(null);
    setSummary({
      totalSeconds: 0,
      goalMinutes: null,
      currentStatus: "로그인 후 확인 가능"
    });
    navigate("/", { replace: true });
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div>
          <h2 className="brand-title">스터디 트래커</h2>
          <p className="brand-text">{authenticated && user?.email ? `사용자: ${user.email}` : ""}</p>
        </div>
        <div className="simple-nav">
          {authenticated ? (
            <>
              <button type="button" onClick={() => navigate("/timer")}>
                공부 타이머
              </button>
              <button type="button" onClick={() => navigate("/subjects")}>
                과목 관리
              </button>
              <button type="button" onClick={() => navigate("/goal")}>
                일일 목표
              </button>
              <button type="button" onClick={() => navigate("/statistics")}>
                통계
              </button>
              <button className="secondary-button" type="button" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button className="primary-button" type="button" onClick={() => navigate("/login")}>
                로그인
              </button>
              <button type="button" onClick={() => navigate("/register")}>
                회원가입
              </button>
            </>
          )}
        </div>
      </div>

      <div className="page-shell">
        <div className="page-view">
          <div className="page-header">
            <div>
              <h1>메인 화면</h1>
              <p>{authenticated ? "오늘 하루도 열심히 공부합시다!" : "로그인 후 이용 가능합니다."}</p>
            </div>
          </div>

          <div className="metric-grid">
            <div className={`metric-box ${authenticated ? "" : "metric-box-locked"}`}>
              <span className="metric-label">오늘 공부 시간</span>
              <div className={`metric-value ${authenticated ? "" : "metric-value-blurred"}`}>
                {formatDuration(summary.totalSeconds)}
              </div>
              {!authenticated ? <div className="locked-note">로그인 후 확인 가능</div> : null}
            </div>
            <div className={`metric-box ${authenticated ? "" : "metric-box-locked"}`}>
              <span className="metric-label">일일 목표</span>
              <div className={`metric-value ${authenticated ? "" : "metric-value-blurred"}`}>
                {summary.goalMinutes ? `${summary.goalMinutes}분` : "설정 안 됨"}
              </div>
              {!authenticated ? <div className="locked-note">로그인 후 확인 가능</div> : null}
            </div>
            <div className={`metric-box ${authenticated ? "" : "metric-box-locked"}`}>
              <span className="metric-label">현재 상태</span>
              <div className={`metric-value ${authenticated ? "" : "metric-value-blurred"}`}>
                {summary.currentStatus}
              </div>
              {!authenticated ? <div className="locked-note">로그인 후 확인 가능</div> : null}
            </div>
          </div>

          <div className="section-box">
          </div>

          <div className="feature-list">
            {featureItems.map((feature) => (
              <FeatureBox
                key={feature.title}
                title={feature.title}
                description={feature.description}
                onClick={() => handleFeatureNavigate(feature.path)}
              />
            ))}
          </div>

          {message ? <div className="status-text">{message}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
