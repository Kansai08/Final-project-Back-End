const { body, validationResult } = require("express-validator");

const validateCreateUser = [
  body("username")
    .notEmpty().withMessage("Username is required")
    .isLength({ min: 5 }).withMessage("Username must be at least 5 characters long"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 5 }).withMessage("Password must be at least 5 characters long"),
  body("full_name")
    .notEmpty().withMessage("Full name is required"),
  body("role")
    .notEmpty().withMessage("Role is required")
    .isIn(["admin", "user"]).withMessage("Role must be either 'admin' or 'user'"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateCreateUser
};
