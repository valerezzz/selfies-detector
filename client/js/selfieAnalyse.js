import Utils from "./utils.js";
import SelfieLandmarks from "./selfieLandmarks.js";
import SelfieVisuals from "./selfieVisuals.js";
import { Camera } from "@mediapipe/camera_utils";

export default class SelfieAnalyse {
  constructor() {
    this.utils = new Utils();
    this.selfieLandmarks = new SelfieLandmarks();
    this.selfieVisuals = new SelfieVisuals();
    //CANVAS SET UP
    const ratio = window.devicePixelRatio;
    const widthCanvas = 720;
    const heightCanvas = 1280;

    // Canvas pour la vidéo
    this.videoCanvasElement =
      document.getElementsByClassName("video_canvas")[0];
    this.videoCanvasCtx = this.videoCanvasElement.getContext("2d");
    this.videoCanvasElement.width = widthCanvas * ratio;
    this.videoCanvasElement.height = heightCanvas * ratio;

    // Canvas pour les landmarks
    this.landmarksCanvasElement =
      document.getElementsByClassName("landmarks_canvas")[0];
    this.landmarksCanvasCtx = this.landmarksCanvasElement.getContext("2d");
    this.landmarksCanvasElement.width = widthCanvas * ratio;
    this.landmarksCanvasElement.height = heightCanvas * ratio;

    // Configuration de l'affichage
    const displayWidth = Math.min(window.innerWidth, widthCanvas);
    const displayHeight = (displayWidth * heightCanvas) / widthCanvas;

    // Appliquer les dimensions aux deux canvas
    [this.videoCanvasElement, this.landmarksCanvasElement].forEach((canvas) => {
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
    });

    this.videoElement = document.getElementsByClassName("input_video")[0];

    this.faceData = null;
    this.gyroscopeData = null;
    this.isTiltedDown = null;
    this.selfieComparator = null;

    this.referenceData = null;
    this.currentMode = 1;
    this.currentVisualMode = 1;
  }

  async init() {
    console.log("initCamera");
    const faceMesh = this.utils.initFaceMesh();

    faceMesh.onResults((results) => {
      this.cameraDraw(results);
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        this.faceData = this.utils.calculateFaceData(
          landmarks,
          this.videoCanvasElement.width,
          this.videoCanvasElement.height
        );
      }
    });

    const camera = new Camera(this.videoElement, {
      onFrame: async () => {
        await faceMesh.send({ image: this.videoElement });
      },
      facingMode: "user",
      width: 1280,
      height: 720,
    });

    camera.start();

    this.utils.initGyroscope((gyroData) => {
      this.gyroscopeData = gyroData;
    });

    this.selfieData = this.getSelfieData();
    console.log("SELFIE DATA", this.selfieData);
    return this.selfieData;
  }

  setReferenceData(data) {
    this.referenceData = data;
  }

  getSelfieData() {
    // Vérifier si les données nécessaires sont disponibles
    if (!this.faceData || !this.gyroscopeData) {
      return null;
    }

    const selfieData = this.utils.getCurrentData(
      this.faceData,
      this.gyroscopeData,
      this.isTiltedDown
    );

    if (this.gyroscopeData.beta < 90) {
      // console.log("telephone en bas");
      this.isTiltedDown = true;
    } else {
      // console.log("telephone en haut");
      this.isTiltedDown = false;
    }

    return selfieData;
  }

  cameraDraw(results) {
    const videoCtx = this.videoCanvasCtx;
    const landmarksCtx = this.landmarksCanvasCtx;
    const videoCanvas = this.videoCanvasElement;
    const landmarksCanvas = this.landmarksCanvasElement;

    // Nettoyer les canvas
    videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
    landmarksCtx.clearRect(0, 0, landmarksCanvas.width, landmarksCanvas.height);

    // Dessiner la vidéo sur le premier canvas
    videoCtx.save();
    videoCtx.scale(-1, 1);
    videoCtx.translate(-videoCanvas.width, 0);
    if (results.image) {
      videoCtx.drawImage(
        results.image,
        0,
        0,
        videoCanvas.width,
        videoCanvas.height
      );
    }
    videoCtx.restore();

    // Dessiner les landmarks sur le deuxième canvas
    landmarksCtx.save();
    landmarksCtx.scale(-1, 1);
    landmarksCtx.translate(-landmarksCanvas.width, 0);
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      if (this.currentMode === 1) {
        this.selfieLandmarks.drawLandmarks(
          landmarksCtx,
          landmarks,
          landmarksCanvas.width,
          landmarksCanvas.height
        );
      }

      if (this.currentMode === 3) {
        const currentData = this.getSelfieData();
        this.selfieVisuals.modeVisuals = this.currentVisualMode; // Ajouter cette ligne

        this.selfieVisuals.drawCanvasShape(
          landmarksCtx,
          landmarksCanvas.width,
          landmarksCanvas.height,
          currentData,
          this.referenceData
        );
      }
    }
    landmarksCtx.restore();
  }
}
