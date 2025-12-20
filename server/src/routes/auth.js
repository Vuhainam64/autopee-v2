const express = require("express");
const { authenticate } = require("../middleware/auth");
const { handleAsync } = require("../middleware/error");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.get(
  "/me",
  authenticate,
  handleAsync(async (req, res) => {
    res.json({ user: req.user });
  }),
);

// Simple logout endpoint (client sẽ tự xoá token phía frontend)
router.post(
  "/logout",
  authenticate,
  handleAsync(async (_req, res) => {
    res.json({ ok: true });
  }),
);

module.exports = router;


