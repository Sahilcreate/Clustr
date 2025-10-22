const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { validationResult } = require("express-validator");
const passport = require("passport");

async function getRegister(req, res) {
  res.render("layouts/noSidebarLayout", {
    title: "Register",
    content: {
      type: "register",
    },
  });
}

async function postRegister(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty) {
    return res.render("layouts/noSidebarLayout", {
      title: "Register",
      content: {
        type: "register",
        errors: errors.array(),
      },
    });
  }

  try {
    const { email, name, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });
  } catch {
    console.error(err);
    next(err);
  }
}

async function getLogin(req, res) {
  res.render("layouts/noSidebarLayout", {
    title: "Login",
    content: {
      type: "login",
    },
  });
}

async function postLogin(req, res) {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
}

async function logout(req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
}

module.exports = {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  logout,
};
