const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

const TOKEN_PATH = path.join(__dirname, "creds/token.json");
if (fs.existsSync(TOKEN_PATH)) {
  const token = fs.readFileSync(TOKEN_PATH);
  oauth2Client.setCredentials(JSON.parse(token));
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get("/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
  });
  res.redirect(url);
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/select", (req, res) => {
  res.render("select");
});

app.get("/result", (req, res) => {
  res.render("result");
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

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    res.send("Autentikasi berhasil! Sekarang kamu bisa upload ke Drive.");
  } catch (error) {
    res.status(500).send("Gagal dapet token: " + error.message);
  }
});

async function uploadToDrive(filePath, fileName) {
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const fileMetadata = {
    name: fileName,
    parents: ["1ko80KTR4TtdbkWVoFhr-XLV3dDXGdxlc"],
  };

  const media = {
    mimeType: "image/png",
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id, webViewLink",
  });

  return response.data;
}

app.post("/api/save-photo", async (req, res) => {
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
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFile(filePath, base64Data, "base64", async (err) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "error", message: "Gagal simpan lokal" });
    }

    try {
      const driveData = await uploadToDrive(filePath, fileName);

      res.json({
        status: "success",
        message: "Foto berhasil disimpan di lokal & Drive!",
        url: `/result/${fileName}`,
        driveUrl: driveData.webViewLink,
        driveId: driveData.id,
      });
    } catch (driveErr) {
      console.error("Drive Upload Error:", driveErr);
      res.json({
        status: "partial_success",
        message: "Simpan lokal ok, tapi gagal ke Drive. Pastikan sudah /auth",
        url: `/result/${fileName}`,
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server meluncur di http://localhost:${PORT}`);
});
