const express = require("express");
const fs = require("fs");
const https = require("https");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
app.use(express.json({ limit: "50mb" })); // Augmenter la limite à 50mb ou plus si nécessaire

const options = {
  key: fs.readFileSync("./private.key"),
  cert: fs.readFileSync("./certificate.crt"),
};

const httpsServer = https.createServer(options, app);
const io = socketIo(httpsServer, {
  cors: {
    origin: "https://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Un client est connecté");

  // Test simple de communication
  socket.emit("messageServeur", "Bonjour depuis le serveur!");

  socket.on("messageClient", (message) => {
    console.log("Message reçu du client:", message);
  });

  socket.on("disconnect", () => {
    console.log("Un client s'est déconnecté");
  });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Connexion réussie" });
});

app.post("/api/upload", (req, res) => {
  const { imageData } = req.body;
  const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, "");
  const filePath = path.join(__dirname, "images", `capture_${Date.now()}.jpg`);

  fs.writeFile(filePath, base64Data, "base64", (err) => {
    if (err) {
      console.error("Erreur lors de l'enregistrement de l'image:", err);
      return res
        .status(500)
        .json({ message: "Erreur lors de l'enregistrement de l'image" });
    }
    console.log("Image enregistrée avec succès:", filePath);
    res.status(200).json({ message: "Image enregistrée avec succès" });
  });
});

const PORT = process.env.PORT || 5001;
httpsServer.listen(PORT, () => {
  console.log(`Serveur HTTPS en écoute sur le port ${PORT}`);
});
