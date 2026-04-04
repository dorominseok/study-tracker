import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthUser, isAuthenticated } from "../api/auth";
import FeatureBox from "../components/FeatureBox";
import { fetchDailyGoal } from "../api/dailyGoal";
import { fetchSessions } from "../api/sessions";
import { fetchDailyStatistics, fetchHeatmapStatistics } from "../api/statistics";
import { formatDuration } from "../utils/format";

function toDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildMonthlyHeatmap(sourceDays = [], year, month) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const firstWeekday = firstDay.getDay();
  const totalsByDay = new Map(
    sourceDays.map((row) => [String(row.day).slice(0, 10), Number(row.totalSeconds || 0)])
  );

  const dayItems = Array.from({ length: lastDay.getDate() }, (_, index) => {
    const date = new Date(year, month - 1, index + 1);

    return {
      key: toDayKey(date),
      dayNumber: index + 1,
      totalSeconds: totalsByDay.get(toDayKey(date)) || 0,
      isFuture: date > today
    };
  });

  const mappedDays = dayItems.map((item) => {
    if (item.isFuture) {
      return { ...item, level: -1 };
    }

    // 월간 히트맵이 과하게 흔들리지 않도록 공부 시간을 고정 단계 레벨로 변환한다.
    if (item.totalSeconds === 0) {
      return { ...item, level: 0 };
    }

    const totalMinutes = item.totalSeconds / 60;

    if (totalMinutes <= 60) {
      return { ...item, level: 1 };
    }

    if (totalMinutes <= 120) {
      return { ...item, level: 2 };
    }

    if (totalMinutes <= 180) {
      return { ...item, level: 3 };
    }

    return { ...item, level: 4 };
  });

  return [
    ...Array.from({ length: firstWeekday }, (_, index) => ({
      key: `empty-start-${year}-${month}-${index}`,
      isPlaceholder: true
    })),
    ...mappedDays
  ];
}

function DashboardPage() {
  const navigate = useNavigate();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [user, setUser] = useState(getAuthUser());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [summary, setSummary] = useState({
    totalSeconds: 0,
    goalMinutes: null,
    currentStatus: "로그인 후 확인 가능"
  });
  const [heatmapDays, setHeatmapDays] = useState(() => buildMonthlyHeatmap([], currentYear, currentMonth));
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
      setHeatmapDays(buildMonthlyHeatmap([], currentYear, selectedMonth));
      setMessage("");
      return;
    }

    async function loadSummary() {
      try {
        // 메인 화면 요약 카드는 여러 API 결과를 한 번에 합쳐서 보여준다.
        const [dailyData, goalData, sessionData, heatmapData] = await Promise.all([
          fetchDailyStatistics(),
          fetchDailyGoal(),
          fetchSessions(),
          fetchHeatmapStatistics(currentYear, selectedMonth)
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
        setHeatmapDays(buildMonthlyHeatmap(heatmapData.days || [], currentYear, selectedMonth));
        setMessage("");
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadSummary();
  }, [authenticated, currentYear, selectedMonth]);

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
    setHeatmapDays(buildMonthlyHeatmap([], currentYear, selectedMonth));
    navigate("/", { replace: true });
  }

  function handlePreviousMonth() {
    setSelectedMonth((prev) => Math.max(1, prev - 1));
  }

  function handleNextMonth() {
    setSelectedMonth((prev) => Math.min(12, prev + 1));
  }

  const monthLabel = `${currentYear}년 ${selectedMonth}월`;

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
            <div className="heatmap-header">
              <h2 className="section-title heatmap-title">공부 캘린더</h2>
              <div className="month-switcher">
                <button
                  className="triangle-button"
                  type="button"
                  onClick={handlePreviousMonth}
                  disabled={selectedMonth === 1}
                  aria-label="이전 달"
                >
                  ◀
                </button>
                <div className="month-switcher-label">{monthLabel}</div>
                <button
                  className="triangle-button"
                  type="button"
                  onClick={handleNextMonth}
                  disabled={selectedMonth === 12}
                  aria-label="다음 달"
                >
                  ▶
                </button>
              </div>
              <div className="heatmap-legend">
                <span>Less</span>
                <div className="heatmap-legend-scale">
                  <span className="month-heatmap-cell heatmap-level-0" />
                  <span className="month-heatmap-cell heatmap-level-1" />
                  <span className="month-heatmap-cell heatmap-level-2" />
                  <span className="month-heatmap-cell heatmap-level-3" />
                  <span className="month-heatmap-cell heatmap-level-4" />
                </div>
                <span>More</span>
              </div>
            </div>

            <div className="month-heatmap-weekdays">
              <span>일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span>토</span>
            </div>

            <div className={`month-heatmap-grid ${authenticated ? "" : "month-heatmap-grid-locked"}`}>
              {heatmapDays.map((day) =>
                day.isPlaceholder ? (
                  <div key={day.key} className="month-heatmap-placeholder" />
                ) : (
                  <div
                    key={day.key}
                    className={`month-heatmap-cell heatmap-level-${authenticated ? day.level : 0}`}
                    title={`${selectedMonth}월 ${day.dayNumber}일 - ${formatDuration(day.totalSeconds)}`}
                  >
                    <span className="month-heatmap-day-number">{day.dayNumber}</span>
                  </div>
                )
              )}
            </div>
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
