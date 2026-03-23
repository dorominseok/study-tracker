import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAuthenticated, login } from "../api/auth";

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  function getNextPath() {
    return location.state?.from || "/";
  }

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    try {
      await login({ email, password });
      navigate(getNextPath(), { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-header">
          <h1>로그인</h1>
        </div>

        <div className="form-block">
          <label className="field-label" htmlFor="login-email">
            E-mail
          </label>
          <input
            id="login-email"
            aria-label="이메일"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-mail"
          />
          <label className="field-label" htmlFor="login-password">
            비밀번호
          </label>
          <input
            id="login-password"
            aria-label="비밀번호"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호"
          />
          <div className="button-row">
            <button className="primary-button" type="button" onClick={handleLogin} disabled={loading}>
              로그인
            </button>
            <Link className="link-button" to="/register">
              회원가입
            </Link>
            <Link className="link-button" to="/">
              홈
            </Link>
          </div>
        </div>

        {message ? <div className="status-text">{message}</div> : null}
      </div>
    </div>
  );
}

export default LoginPage;
