const { body, validationResult } = require("express-validator");

const validateCreateProduct = [
  body("name")
    .notEmpty().withMessage("Name is required")
    .isString().withMessage("Name must be a string"),
  body("description")
    .notEmpty().withMessage("Description is required")
    .isString().withMessage("Description must be a string"),
  body("price")
    .notEmpty().withMessage("Price is required")
    .isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("stock")
    .notEmpty().withMessage("Stock is required")
    .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const validateUpdateProduct = [
  body("name")
    .optional()
    .isString().withMessage("Name must be a string"),
  body("description")
    .optional()
    .isString().withMessage("Description must be a string"),
  body("price")
    .optional()
    .isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("stock")
    .optional()
    .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct
};