const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

app.get("/photo/:sceneName", (req, res) => {
  const scene = req.params.sceneName;

  res.render("photo", { selectedScene: scene });
});

app.get("/api/status", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server Node.js jalan cuy!",
  });
});

app.post("/api/save-photo", (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res
      .status(400)
      .json({ status: "error", message: "Gak ada gambarnya!" });
  }

  const base64Data = image.replace(/^data:image\/png;base64,/, "");

  const fileName = `result_${Date.now()}.png`;
  const filePath = path.join(__dirname, "public", "result", fileName);

  const dir = path.join(__dirname, "public", "result");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFile(filePath, base64Data, "base64", (err) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ status: "error", message: "Gagal nyimpen file" });
    }

    res.json({
      status: "success",
      message: "Foto berhasil disimpan!",
      url: `/result/${fileName}`,
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server meluncur di http://localhost:${PORT}`);
});
