const express = require("express");
const router = express.Router();
const {
  signUp,
  signIn,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/users");

// Register
router.post("/", signUp);
// Login
router.post("/login", signIn);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

module.exports = router;
