async function indexController(req, res) {
  res.render("index", { title: "Welcome to Clustr" });
}

module.exports = { indexController };
