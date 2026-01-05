const { validationResult } = require("express-validator");

function handleValidationErrors(req, res, next) {
  // console.log("handleValidationErrors");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => e.msg),
    });
  }
  next();
}

module.exports = { handleValidationErrors };
