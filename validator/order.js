const { body, validationResult } = require("express-validator");

const validateCreateOrder = [
  body("productId")
    .notEmpty().withMessage("Product ID is required")
    .isString().withMessage("Product ID must be a string"),
  body("quantity")
    .notEmpty().withMessage("Quantity is required")
    .isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateCreateOrder
};