require("dotenv").config();
const path = require("node:path");
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const flash = require("connect-flash");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const { ensureAuthenticated } = require("./middlewares/auth");
const prisma = new PrismaClient();
require("./config/passport"); //initialized passport strategies

const app = express();

// VIEW + CORE MIDDLEWARE -----------------------------------------------------------
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// SESSION + FLASH + PASSPORT -------------------------------------------------------

// session setup with prisma store
const sessionStore = new PrismaSessionStore(prisma, {
  checkPeriod: 2 * 60 * 1000,
  dbRecordIdIsSessionId: true,
  dbRecordIdFunction: undefined,
});
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

// passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// LOCALS SETUP --------------------------------------------------------------------
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  // res.locals.error = req.flash("error");
  next();
});

// ROUTES --------------------------------------------------------------------------
const { routes } = require("./routes/index");
app.use("/", routes.indexRouter);
app.use("/auth", routes.authRouter);
app.use("/folders", ensureAuthenticated, routes.folderRouter);
app.use("/files", ensureAuthenticated, routes.fileRouter);
app.use("/share", routes.shareRouter);

// GLOBAL ERROR HANDLER ------------------------------------------------------------
app.use((err, req, res, next) => {
  if (err.name === "NulterError") {
    err.message = "Invalid file upload: " + err.message;
  }
  next(err);
});

app.use((err, req, res, next) => {
  console.error("Error: ", err.message);

  const isAjax = req.xhr || req.headers.accept?.includes("json");

  if (isAjax) {
    return res.status(err.status || 500).json({
      error: err.message || "Internal server error",
    });
  }

  req.flash("error", err.message || "Something went wrong");

  const backURL = req.get("Referer") || "/folders";
  res.redirect(backURL);
});

// SERVER --------------------------------------------------------------------------
const PORT = process.env.PG_PORT;
app.listen(PORT, () => {
  console.log(`Clustr - listening to port ${PORT}`);
});
