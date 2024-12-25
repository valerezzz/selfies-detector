import io from "socket.io-client";
import SelfieInteraction from "./selfieInteraction.js";

export default class App {
  constructor() {
    this.selfieInteraction = new SelfieInteraction();
    this.init();
  }

  async init() {
    console.log("App init");
    await this.connectToServer();
    this.selfieInteraction.init();
  }

  async connectToServer() {
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

    const socket = io({
      path: "/socket.io",
      secure: true,
      rejectUnauthorized: false,
    });
  }
}
