const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const dbPromise = db.promise();

router.use(authMiddleware);

async function findSubjectForUser(subjectId, userId) {
  const [subjects] = await dbPromise.query(
    "SELECT id FROM `Subject` WHERE id = ? AND user_id = ?",
    [subjectId, userId]
  );

  return subjects[0] || null;
}

async function getSessionById(sessionId, userId) {
  const [sessions] = await dbPromise.query(
    "SELECT id, user_id, subject_id, start_time, end_time, duration, memo, status, last_resume_time, created_at FROM `StudySession` WHERE id = ? AND user_id = ?",
    [sessionId, userId]
  );

  return sessions[0] || null;
}

function parseOptionalId(value, message) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: message };
  }

  return { value: parsed };
}

router.post("/start", async (req, res) => {
  const subjectIdResult = parseOptionalId(req.body.subjectId, "Invalid subject id.");
  const memo = typeof req.body.memo === "string" ? req.body.memo.trim() : null;
  const subjectId = subjectIdResult.value;

  if (subjectIdResult.error) {
    return res.status(400).json({
      message: subjectIdResult.error
    });
  }

  try {
    // 타이머 화면은 사용자당 미완료 세션이 하나라고 가정하므로 중복 시작을 막는다.
    const [openSessions] = await dbPromise.query(
      "SELECT id FROM `StudySession` WHERE user_id = ? AND end_time IS NULL AND status IN ('active', 'paused') ORDER BY start_time DESC LIMIT 1",
      [req.user.id]
    );

    if (openSessions.length > 0) {
      return res.status(409).json({
        message: "An unfinished study session already exists."
      });
    }

    if (subjectId !== null && !(await findSubjectForUser(subjectId, req.user.id))) {
      return res.status(404).json({
        message: "Subject not found."
      });
    }

    const startTime = new Date();
    const [insertResult] = await dbPromise.query(
      "INSERT INTO `StudySession` (user_id, subject_id, start_time, duration, memo, status, last_resume_time) VALUES (?, ?, ?, ?, ?, 'active', ?)",
      [req.user.id, subjectId, startTime, 0, memo, startTime]
    );
    const session = await getSessionById(insertResult.insertId, req.user.id);

    return res.status(201).json({
      message: "Study session started successfully.",
      session
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to start study session.",
      error: error.message
    });
  }
});

router.post("/pause", async (req, res) => {
  const memo = typeof req.body.memo === "string" ? req.body.memo.trim() : null;

  try {
    const [sessions] = await dbPromise.query(
      "SELECT id, start_time, duration, memo, last_resume_time FROM `StudySession` WHERE user_id = ? AND end_time IS NULL AND status = 'active' ORDER BY start_time DESC LIMIT 1",
      [req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        message: "Active study session not found."
      });
    }

    const session = sessions[0];
    const pausedAt = new Date();
    const activeSince = session.last_resume_time || session.start_time;
    // 마지막 재개 시점 이후의 활성 구간만 계산해서 누적 공부 시간에 반영한다.
    const nextDuration =
      Number(session.duration || 0) +
      Math.max(0, Math.floor((pausedAt.getTime() - new Date(activeSince).getTime()) / 1000));
    const nextMemo = memo !== null ? memo : session.memo;

    await dbPromise.query(
      "UPDATE `StudySession` SET duration = ?, memo = ?, status = 'paused', last_resume_time = NULL WHERE id = ? AND user_id = ?",
      [nextDuration, nextMemo, session.id, req.user.id]
    );

    const updatedSession = await getSessionById(session.id, req.user.id);

    return res.status(200).json({
      message: "Study session paused successfully.",
      session: updatedSession
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to pause study session.",
      error: error.message
    });
  }
});

router.post("/resume", async (req, res) => {
  const memo = typeof req.body.memo === "string" ? req.body.memo.trim() : null;

  try {
    const [sessions] = await dbPromise.query(
      "SELECT id, memo FROM `StudySession` WHERE user_id = ? AND end_time IS NULL AND status = 'paused' ORDER BY start_time DESC LIMIT 1",
      [req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        message: "Paused study session not found."
      });
    }

    const session = sessions[0];
    const resumedAt = new Date();
    const nextMemo = memo !== null ? memo : session.memo;

    // 재개 시점부터 새로운 활성 구간이 시작되므로 다음 pause/end 계산 기준을 다시 잡는다.
    await dbPromise.query(
      "UPDATE `StudySession` SET memo = ?, status = 'active', last_resume_time = ? WHERE id = ? AND user_id = ?",
      [nextMemo, resumedAt, session.id, req.user.id]
    );

    const updatedSession = await getSessionById(session.id, req.user.id);

    return res.status(200).json({
      message: "Study session resumed successfully.",
      session: updatedSession
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to resume study session.",
      error: error.message
    });
  }
});

router.post("/end", async (req, res) => {
  const sessionIdResult = parseOptionalId(req.body.sessionId, "Invalid session id.");
  const memo = typeof req.body.memo === "string" ? req.body.memo.trim() : null;
  const sessionId = sessionIdResult.value;

  if (sessionIdResult.error) {
    return res.status(400).json({
      message: sessionIdResult.error
    });
  }

  try {
    const sessionQuery =
      sessionId === null
        ? "SELECT id, start_time, duration, memo, status, last_resume_time FROM `StudySession` WHERE user_id = ? AND end_time IS NULL AND status IN ('active', 'paused') ORDER BY start_time DESC LIMIT 1"
        : "SELECT id, start_time, duration, memo, status, last_resume_time FROM `StudySession` WHERE id = ? AND user_id = ? AND end_time IS NULL AND status IN ('active', 'paused') LIMIT 1";
    const sessionParams = sessionId === null ? [req.user.id] : [sessionId, req.user.id];
    const [sessions] = await dbPromise.query(sessionQuery, sessionParams);

    if (sessions.length === 0) {
      return res.status(404).json({
        message: "Unfinished study session not found."
      });
    }

    const session = sessions[0];
    const endTime = new Date();
    const activeSince = session.last_resume_time || session.start_time;
    // paused 상태는 이미 활성 시간이 duration에 반영되어 있고, active 상태만 종료 시 추가 계산이 필요하다.
    const additionalDuration =
      session.status === "active"
        ? Math.max(0, Math.floor((endTime.getTime() - new Date(activeSince).getTime()) / 1000))
        : 0;
    const duration = Number(session.duration || 0) + additionalDuration;
    const nextMemo = memo !== null ? memo : session.memo;

    await dbPromise.query(
      "UPDATE `StudySession` SET end_time = ?, duration = ?, memo = ?, status = 'completed', last_resume_time = NULL WHERE id = ? AND user_id = ?",
      [endTime, duration, nextMemo, session.id, req.user.id]
    );
    const updatedSession = await getSessionById(session.id, req.user.id);

    return res.status(200).json({
      message: "Study session ended successfully.",
      session: updatedSession
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to end study session.",
      error: error.message
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const [sessions] = await dbPromise.query(
      "SELECT id, user_id, subject_id, start_time, end_time, duration, memo, status, last_resume_time, created_at FROM `StudySession` WHERE user_id = ? ORDER BY start_time DESC, id DESC",
      [req.user.id]
    );

    return res.status(200).json({
      sessions
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch study sessions.",
      error: error.message
    });
  }
});

module.exports = router;
