import Utils from "./utils.js";
import SelfieLandmarks from "./selfieLandmarks.js";

export default class SelfieCapture {
  constructor() {
    this.utils = new Utils();
    this.serverUrl = `https://192.168.1.111:5001`;

    this.init();
  }

  init() {
    console.log("initSelfieCapture");
  }

  async captureSelfie(canvasElement, selfieData) {
    console.log("captureSelfie");

    // Créer un nouveau canvas temporaire pour la compression
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    // Définir les dimensions souhaitées (par exemple, réduire de moitié)
    const maxWidth = 640 * 2; // ou la taille que vous souhaitez
    const maxHeight = 480 * 2;

    // Calculer les nouvelles dimensions en conservant le ratio
    let newWidth = canvasElement.width;
    let newHeight = canvasElement.height;

    if (newWidth > maxWidth) {
      const ratio = maxWidth / newWidth;
      newWidth = maxWidth;
      newHeight = newHeight * ratio;
    }
    if (newHeight > maxHeight) {
      const ratio = maxHeight / newHeight;
      newHeight = maxHeight;
      newWidth = newWidth * ratio;
    }

    // Configurer le canvas temporaire
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;

    // Dessiner l'image redimensionnée
    tempCtx.drawImage(canvasElement, 0, 0, newWidth, newHeight);

    // Convertir en JPEG avec compression (0.7 = 70% de qualité)
    const imageData = tempCanvas.toDataURL("image/jpeg", 0.7);
    const timestamp = new Date().getTime();

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageData: imageData,
        timestamp: timestamp,
        detectorData: selfieData,
      }),
    });

    const result = await response.json();
    console.log("Selfie enregistré avec succès:", result);
    return result;
  }
}
