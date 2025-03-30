const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { validateLogin } = require("../validator/auth");

const router = express();

const reqLogin = passport.authenticate("user-local", { session: false });

router.post("/login", validateLogin, reqLogin, (req, res) => {
  const token = jwt.sign(req.user, process.env.jwt_secret, {
    expiresIn: "1d",
  });

  res.status(200).send({
    message: "Login successful",
    token: token
  });
});

module.exports = router;
