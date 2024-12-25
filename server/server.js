const express = require("express");
const fs = require("fs").promises;
const fsSync = require("fs");
const https = require("https");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
app.use(express.json({ limit: "50mb" })); // Augmenter la limite à 50mb ou plus si nécessaire

// Servir explicitement le dossier images
app.use("/images", express.static(path.join(__dirname, "images")));

const options = {
  key: fsSync.readFileSync("./ssl/private.key"),
  cert: fsSync.readFileSync("./ssl/certificate.crt"),
};

const httpsServer = https.createServer(options, app);
const io = socketIo(httpsServer, {
  cors: {
    origin: ["https://192.168.1.111:5173"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type"],
  },
});

// Ajouter ces middlewares CORS pour Express
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://192.168.1.111:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
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

app.post("/api/upload", async (req, res) => {
  console.log("Requête reçue sur /api/upload");
  try {
    const { imageData, timestamp, detectorData } = req.body;
    const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, "");
    const fileName = `selfie${timestamp}.jpg`;
    const filePath = path.join(__dirname, "images", fileName);
    const jsonPath = path.join(__dirname, "data", "photoData.json");

    // Enregistrer l'image
    await fs.writeFile(filePath, base64Data, "base64");

    // Préparer les données pour le JSON
    const photoData = {
      imagePath: `/images/${fileName}`,
      dateCapture: new Date().toISOString(),
      detectorData: {
        faceData: detectorData.faceData,
        gyroscopeData: detectorData.gyroscopeData,
        isTiltedDown: detectorData.isTiltedDown,
        timestamp: detectorData.timestamp,
      },
    };

    // Lire le fichier JSON existant
    let existingData;
    try {
      const jsonContent = await fs.readFile(jsonPath, "utf8");
      existingData = JSON.parse(jsonContent);
    } catch (error) {
      existingData = { Up: [], Down: [] };
      console.log("Création d'un nouveau fichier JSON");
    }

    // Utiliser isTiltedDown pour déterminer la catégorie
    const category = detectorData.isTiltedDown ? "Down" : "Up";

    // Ajouter les nouvelles données dans la bonne catégorie
    existingData[category].push(photoData);

    // Enregistrer le fichier JSON mis à jour
    await fs.writeFile(jsonPath, JSON.stringify(existingData, null, 2), "utf8");

    console.log(
      `Image et données enregistrées avec succès dans la catégorie ${category}`
    );
    res.status(200).json({
      message: "Image et données enregistrées avec succès",
      photoData: photoData,
      category: category,
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement:", error);
    res.status(500).json({ message: "Erreur lors de l'enregistrement" });
  }
});

app.get("/api/getReferenceData", async (req, res) => {
  const jsonPath = path.join(__dirname, "data", "photoData.json");
  const jsonContent = await fs.readFile(jsonPath, "utf8");
  const photoData = JSON.parse(jsonContent);
  res.json(photoData);
});

const PORT = process.env.PORT || 5001;
httpsServer.listen(PORT, () => {
  console.log(`Serveur HTTPS en écoute sur le port ${PORT}`);
});
