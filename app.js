require("dotenv").config();
const path = require("node:path");
const express = require("express");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const { routes } = require("./routes/index");
app.use("/", routes.indexRouter);

app.use((err, req, res, next) => {
  console.log(err.message);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PG_PORT;
app.listen(PORT, () => {
  console.log(`Clustr - listening to port ${PORT}`);
});
