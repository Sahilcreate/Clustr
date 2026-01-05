const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { validationResult } = require("express-validator");

async function getRegister(req, res) {
  res.render("layouts/noSidebarLayout", {
    title: "Register",
    content: {
      type: "register",
      errors: null,
    },
  });
}

async function postRegister(req, res, next) {
  const errors = validationResult(req);

  // Validation failed -> flash + redirect
  if (!errors.isEmpty()) {
    return res.render("layouts/noSidebarLayout", {
      title: "Register",
      content: {
        type: "register",
        errors: errors.array(),
      },
    });

    // req.flash(
    //   "error",
    //   errors.array().map((e) => e.msg)
    // );
    // return res.redirect("/auth/register");
  }

  try {
    const { email, name, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    // User exists
    if (existingUser) {
      req.flash("error", "User with this email already exists.");
      return res.redirect("/auth/register");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // Success flash message
    req.flash("success", "Account created successfully. Please log in.");
    res.redirect("/auth/login");
  } catch {
    console.error("Registeration error: ", err);
    next(err); // to global error handler
  }
}

async function getLogin(req, res) {
  res.render("layouts/noSidebarLayout", {
    title: "Login",
    content: {
      type: "login",
      errors: null,
    },
  });
}

async function logout(req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    req.flash("success", "You have been logged out");
    res.redirect("/");
  });
}

module.exports = {
  getRegister,
  postRegister,
  getLogin,
  logout,
};
