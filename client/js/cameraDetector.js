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

    const startButton = document.getElementById("startCameraButton");
    const intro = document.getElementById("intro");
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

    if (startButton) {
      startButton.addEventListener("click", async () => {
        // Initialiser la caméra
        await this.init();
        intro.style.display = "none";
        // Initialiser le gyroscope en même temps
        console.log("Initialisation du gyroscope...");
        await this.utils.initGyroscope((gyroData) => {
          this.gyroscopeData = gyroData;
        });
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
