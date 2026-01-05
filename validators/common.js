const { param } = require("express-validator");
exports.validateIdParam = (name) =>
  param(name)
    .isInt({ min: 1 })
    .withMessage(`${name} must be a positive integer`);
