import CameraDetector from "./cameraDetector.js";
import PhotoCapture from "./photoCapture.js";
import io from "socket.io-client";

export default class App {
  constructor() {
    this.init();
  }

  async init() {
    console.log("App init");

    // Test de la connexion au serveur
    try {
      const response = await fetch("/api/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const responseText = await response.text();
        console.log("Réponse brute:", responseText);
        const data = JSON.parse(responseText);
        console.log("Connexion au serveur réussie:", data);
      } else {
        console.error("Erreur de connexion au serveur");
      }
    } catch (error) {
      console.error("Erreur lors de la communication avec le serveur:", error);
    }

    const cameraDetector = new CameraDetector();
    const photoCapture = new PhotoCapture(cameraDetector);

    const socket = io({
      path: "/socket.io",
      secure: true,
      rejectUnauthorized: false,
    });
  }
}
