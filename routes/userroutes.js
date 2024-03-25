const express = require("express");
const {
  registerUser,
  loginUser,
  isAuth,
} = require("../controllers/userController.js");
const router = express.Router();
router.route("/login").post(loginUser);
router.route("/create").post(registerUser);
router.route("/isAuth").get(isAuth);
module.exports = router;
