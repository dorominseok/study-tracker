import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthUser, isAuthenticated } from "../api/auth";

function ProtectedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAuthUser();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  function handleLogout() {
    clearAuthSession();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <NavLink className="brand-link" to="/" end>
          <h2 className="brand-title">스터디 트래커</h2>
          <p className="brand-text">{user?.email ? `사용자: ${user.email}` : "로그인됨"}</p>
        </NavLink>
        <div className="simple-nav">
          <NavLink
            className={({ isActive }) => (isActive ? "link-button nav-link-active" : "link-button")}
            to="/timer"
          >
            공부 타이머
          </NavLink>
          <NavLink
            className={({ isActive }) => (isActive ? "link-button nav-link-active" : "link-button")}
            to="/subjects"
          >
            과목 관리
          </NavLink>
          <NavLink
            className={({ isActive }) => (isActive ? "link-button nav-link-active" : "link-button")}
            to="/goal"
          >
            일일 목표
          </NavLink>
          <NavLink
            className={({ isActive }) => (isActive ? "link-button nav-link-active" : "link-button")}
            to="/statistics"
          >
            통계
          </NavLink>
          <button className="secondary-button" type="button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
      <div className="page-shell">
        <Outlet />
      </div>
    </div>
  );
}

export default ProtectedLayout;
