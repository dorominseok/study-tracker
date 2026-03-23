import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, register } from "../api/auth";

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  async function handleRegister() {
    setLoading(true);
    setMessage("");

    try {
      await register({ email, password });
      navigate("/", { replace: true });
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
          <h1>회원가입</h1>
          
        </div>

        <div className="form-block">
          <label className="field-label" htmlFor="register-email">
            E-mail
          </label>
          <input
            id="register-email"
            aria-label="이메일"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-mail"
          />
          <label className="field-label" htmlFor="register-password">
            비밀번호
          </label>
          <input
            id="register-password"
            aria-label="비밀번호"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호"
          />
          <div className="button-row">
            <button className="primary-button" type="button" onClick={handleRegister} disabled={loading}>
              회원가입
            </button>
            <Link className="link-button" to="/login">
              로그인
            </Link>
          </div>
        </div>

        {message ? <div className="status-text">{message}</div> : null}
      </div>
    </div>
  );
}

export default RegisterPage;
