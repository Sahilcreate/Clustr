require("dotenv").config();
const path = require("node:path");

const express = require("express");
const passport = require("passport");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const { ensureAuthenticated } = require("./middlewares/auth");

// const pool = require("./db/pool");
// const pgSession = require("connect-pg-session")(session);

const prisma = new PrismaClient();
require("./config/passport"); //initialized passport strategies

const app = express();

// view setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

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

// routes
const { routes } = require("./routes/index");

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use("/", routes.indexRouter);
app.use("/auth", routes.authRouter);

app.use((err, req, res, next) => {
  console.log(err.message);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PG_PORT;
app.listen(PORT, () => {
  console.log(`Clustr - listening to port ${PORT}`);
});
