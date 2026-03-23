import { useEffect, useState } from "react";
import { createSubject, deleteSubject, fetchSubjects } from "../api/subjects";

function SubjectPage() {
  const [name, setName] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSubjects() {
    try {
      const data = await fetchSubjects();
      setSubjects(data.subjects);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  async function handleCreate() {
    setLoading(true);
    setMessage("");

    try {
      await createSubject(name);
      setName("");
      await loadSubjects();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(subjectId) {
    setLoading(true);
    setMessage("");

    try {
      await deleteSubject(subjectId);
      await loadSubjects();
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
          <h1>과목 관리</h1>
          <p>공부할 과목을 추가하고 삭제할 수 있습니다.</p>
        </div>
      </div>

      <div className="split-section">
        <div className="section-box">
          <h2 className="section-title">새 과목 추가</h2>
          <div className="form-block">
            <label className="field-label" htmlFor="subject-name">
              과목 이름
            </label>
            <input
              id="subject-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="과목 이름"
            />
            <button className="primary-button" type="button" onClick={handleCreate} disabled={loading}>
              과목 추가
            </button>
          </div>
        </div>

        <div className="section-box">
          <h2 className="section-title">과목 목록</h2>
          <div className="list-block">
            {subjects.map((subject) => (
              <div key={subject.id} className="list-row">
                <span>{subject.name}</span>
                <button type="button" onClick={() => handleDelete(subject.id)} disabled={loading}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {message ? <div className="status-text">{message}</div> : null}
    </div>
  );
}

export default SubjectPage;
