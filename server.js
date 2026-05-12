const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/select", (req, res) => {
  res.render("select");
});

app.get("/photo", (req, res) => {
  res.render("photo");
});

app.get("/api/status", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server Node.js jalan cuy!",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server meluncur di http://localhost:${PORT}`);
});
