import Utils from "./utils.js";
import { Camera } from "@mediapipe/camera_utils";
import PoseComparator from "./poseComparator.js";

export default class CameraDetector {
  constructor() {
    this.utils = new Utils();

    const ratio = window.devicePixelRatio;
    const widthCanvas = 720;
    const heightCanvas = 1280;

    // Récupération des éléments DOM
    this.canvasElement = document.getElementsByClassName("output_canvas")[0];
    this.canvasCtx = this.canvasElement.getContext("2d");
    this.videoElement = document.getElementsByClassName("input_video")[0];

    const intro = document.getElementById("intro");

    const startVideoButton = document.getElementById("startVideoButton");
    const videoContent = document.getElementById("videoContent");

    const startImageButton = document.getElementById("startImageButton");

    const backButton = document.getElementById("backButton");

    // Configuration dynamique du canvas
    this.canvasElement.width = widthCanvas * ratio;
    this.canvasElement.height = heightCanvas * ratio;

    const displayWidth = Math.min(window.innerWidth, widthCanvas);
    const displayHeight = (displayWidth * heightCanvas) / widthCanvas;

    this.canvasElement.style.width = `${displayWidth}px`;
    this.canvasElement.style.height = `${displayHeight}px`;

    console.log(this.canvasElement.style.width);
    console.log(this.canvasElement.style.height);

    this.gyroscopeData = null;
    this.currentFaceData = null;

    this.lastLogTime = 0;
    this.logInterval = 100;

    this.poseComparator = new PoseComparator();

    this.matchedImageElement = document.getElementById("matched-image");

    // Récupérer l'URL du serveur depuis window.location
    this.serverUrl = `${window.location.protocol}//${window.location.hostname}:5001`;

    if (startVideoButton) {
      startVideoButton.addEventListener("click", async () => {
        // Initialiser la caméra
        this.poseComparator.stop();
        await this.init();
        intro.style.display = "none";
        this.matchedImageElement.style.display = "none";
        videoContent.style.display = "flex";

        // Initialiser le gyroscope en même temps
        console.log("Initialisation du gyroscope...");
        await this.utils.initGyroscope((gyroData) => {
          this.gyroscopeData = gyroData;
        });
        // await this.poseComparator.init();
      });
    }

    if (startImageButton) {
      startImageButton.addEventListener("click", async () => {
        // Initialiser la caméra
        await this.init();
        intro.style.display = "none";
        this.matchedImageElement.style.display = "block";
        videoContent.style.display = "flex";

        // Initialiser le gyroscope en même temps
        console.log("Initialisation du gyroscope...");
        await this.utils.initGyroscope((gyroData) => {
          this.gyroscopeData = gyroData;
        });
        await this.poseComparator.init();
      });
    }

    if (backButton) {
      backButton.addEventListener("click", () => {
        intro.style.display = "flex";
        videoContent.style.display = "none";
        this.matchedImageElement.style.display = "none";

        this.poseComparator.stop();
      });
    }
  }

  async init() {
    const faceMesh = await this.utils.initFaceMesh();

    faceMesh.onResults((results) => this.cameraDraw(results));

    const camera = new Camera(this.videoElement, {
      onFrame: async () => {
        await faceMesh.send({ image: this.videoElement });
      },
      facingMode: "user",
      width: 1280,
      height: 720,
    });

    camera.start();
  }

  cameraDraw(results) {
    const ctx = this.canvasCtx;
    const canvas = this.canvasElement;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Inverser le contexte horizontalement
    ctx.save(); // Sauvegarder le contexte actuel
    ctx.scale(-1, 1); // Inverser horizontalement
    ctx.translate(-canvas.width, 0); // Déplacer le contexte pour dessiner correctement

    // Dessiner la vidéo sur le canvas en mode miroir
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    ctx.restore(); // Restaurer le contexte à son état original

    // Dessiner les landmarks
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      //this.utils.drawLandmarks(ctx, landmarks, canvas.width, canvas.height);

      // Optionnel : Calculer et afficher les données du visage
      this.currentFaceData = this.utils.calculateFaceData(
        landmarks,
        canvas.width,
        canvas.height
      );

      const currentTime = Date.now();
      if (currentTime - this.lastLogTime >= this.logInterval) {
        console.log("Face Data:", this.currentFaceData);
        console.log("Gyroscope Data:", this.gyroscopeData);
        const currentData = this.getCurrentFaceData();
        const closestMatch = this.poseComparator.findClosestPose(currentData);

        if (closestMatch && closestMatch.imagePath) {
          // Utiliser l'URL du serveur dynamique
          this.matchedImageElement.src = `${this.serverUrl}${closestMatch.imagePath}`;
        }

        this.lastLogTime = currentTime;
      }
    }
  }

  getCurrentFaceData() {
    return {
      faceData: this.currentFaceData,
      gyroscopeData: this.gyroscopeData,
      timestamp: new Date().getTime(),
    };
  }
}
