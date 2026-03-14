const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const dbPromise = db.promise();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const [subjects] = await dbPromise.query(
      "SELECT id, user_id, name, created_at FROM `Subject` WHERE user_id = ? ORDER BY created_at DESC, id DESC",
      [req.user.id]
    );

    return res.status(200).json({
      subjects
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch subjects.",
      error: error.message
    });
  }
});

router.post("/", async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

  if (!name) {
    return res.status(400).json({
      message: "Subject name is required."
    });
  }

  try {
    const [insertResult] = await dbPromise.query(
      "INSERT INTO `Subject` (user_id, name) VALUES (?, ?)",
      [req.user.id, name]
    );

    const [subjects] = await dbPromise.query(
      "SELECT id, user_id, name, created_at FROM `Subject` WHERE id = ? AND user_id = ?",
      [insertResult.insertId, req.user.id]
    );

    return res.status(201).json({
      message: "Subject created successfully.",
      subject: subjects[0]
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create subject.",
      error: error.message
    });
  }
});

router.delete("/:id", async (req, res) => {
  const subjectId = Number(req.params.id);

  if (!Number.isInteger(subjectId) || subjectId <= 0) {
    return res.status(400).json({
      message: "Invalid subject id."
    });
  }

  try {
    const [deleteResult] = await dbPromise.query(
      "DELETE FROM `Subject` WHERE id = ? AND user_id = ?",
      [subjectId, req.user.id]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({
        message: "Subject not found."
      });
    }

    return res.status(200).json({
      message: "Subject deleted successfully."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete subject.",
      error: error.message
    });
  }
});

module.exports = router;
