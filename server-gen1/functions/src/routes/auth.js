const express = require("express");
const {authenticate} = require("../middleware/auth");
const {handleAsync} = require("../middleware/error");
const {logoutUser} = require("../services/authService");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ok: true});
});

router.get(
    "/me",
    authenticate,
    handleAsync(async (req, res) => {
      res.json({user: req.user});
    }),
);

router.post(
    "/logout",
    authenticate,
    handleAsync(async (req, res) => {
      await logoutUser(req.user.uid);
      res.json({ok: true});
    }),
);

module.exports = router;

