import Utils from "./utils.js";

export default class ImagesDetector {
  constructor() {
    this.utils = new Utils();
    this.jsonData = [];
  }

  async processImages(files) {
    const faceMesh = await this.utils.initFaceMesh();

    // Préparer une promesse pour attendre les résultats de Mediapipe
    const getLandmarks = (image) => {
      return new Promise((resolve, reject) => {
        faceMesh.onResults((results) => {
          if (
            results.multiFaceLandmarks &&
            results.multiFaceLandmarks.length > 0
          ) {
            resolve(results.multiFaceLandmarks[0]); // Retourne les landmarks du premier visage
          } else {
            resolve(null); // Aucun visage détecté
          }
        });

        // Envoyer l'image pour traitement
        faceMesh.send({ image }).catch((err) => reject(err));
      });
    };

    for (const file of files) {
      const image = await this.loadImage(file);

      // Vérifier si l'image est valide
      if (!image.width || !image.height) {
        console.warn(`Image ${file.name} has invalid dimensions.`);
        continue;
      }

      const landmarks = await getLandmarks(image);

      if (landmarks) {
        const data = this.utils.calculateFaceData(
          landmarks,
          image.width,
          image.height
        );
        this.jsonData.push({ fileName: file.name, data });
      } else {
        console.warn(`No face detected in ${file.name}`);
      }
    }

    console.log("JSON Data:", this.jsonData);

    // Sauvegarder ou mettre à jour le fichier JSON
    this.saveJsonFile(this.jsonData, "face_data.json");
  }

  async loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  }

  saveJsonFile(data, filename) {
    // Convertir les données en chaîne JSON
    const jsonString = JSON.stringify(data, null, 2);

    // Créer un Blob avec les données JSON
    const blob = new Blob([jsonString], { type: "application/json" });

    // Créer un lien de téléchargement
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;

    // Ajouter et cliquer sur le lien
    document.body.appendChild(link);
    link.click();

    // Nettoyer le DOM
    document.body.removeChild(link);
  }
}
