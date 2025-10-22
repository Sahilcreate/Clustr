const {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  logout,
} = require("./authController");
const { indexController } = require("./indexController");

const controllers = {
  indexController,
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  logout,
};

module.exports = { controllers };
