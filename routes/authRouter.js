const { Router } = require("express");
const { controllers } = require("../controllers/index");
const { body } = require("express-validator");

const authRouter = Router();

authRouter.get("/register", controllers.getRegister);
authRouter.post(
  "/register",
  body("password")
    .exists()
    .withMessage("password is required")
    .isLength({ min: 5 }),
  body("passwordConfirmation")
    .exists()
    .withMessage("password confirmation is mandatory")
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("Confirmation field not matching"),
  body("email")
    .exists()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email not valid"),
  controllers.postRegister
);

authRouter.get("/login", controllers.getLogin);
authRouter.post("/login", controllers.postLogin);

authRouter.post("/logout", controllers.logout);

module.exports = { authRouter };
