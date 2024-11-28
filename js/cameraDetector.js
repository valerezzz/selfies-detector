import Utils from "./utils.js";
import { Camera } from "@mediapipe/camera_utils";

export default class CameraDetector {
  constructor() {
    this.utils = new Utils();

    const ratio = window.devicePixelRatio;
    const widthCanvas = 390;
    const heightCanvas = 550;

    // Récupération des éléments DOM
    this.canvasElement = document.getElementsByClassName("output_canvas")[0];
    this.canvasCtx = this.canvasElement.getContext("2d");
    this.videoElement = document.getElementsByClassName("input_video")[0];

    // Configuration dynamique du canvas
    this.canvasElement.width = widthCanvas * ratio;
    this.canvasElement.height = heightCanvas * ratio;

    this.canvasElement.style.width = `${widthCanvas}px`;
    this.canvasElement.style.height = `${heightCanvas}px`;
  }

  async init() {
    const faceMesh = await this.utils.initFaceMesh();

    faceMesh.onResults((results) => this.cameraDraw(results));

    const camera = new Camera(this.videoElement, {
      onFrame: async () => {
        await faceMesh.send({ image: this.videoElement });
      },
      facingMode: "user",
      width: this.widthCanvas,
      height: this.heightCanvas,
    });

    camera.start();
  }

  cameraDraw(results) {
    const ctx = this.canvasCtx;
    const canvas = this.canvasElement;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner la vidéo sur le canvas
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    // Dessiner les landmarks
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      this.utils.drawLandmarks(ctx, landmarks, canvas.width, canvas.height);

      // Optionnel : Calculer et afficher les données du visage
      const faceData = this.utils.calculateFaceData(
        landmarks,
        canvas.width,
        canvas.height
      );
      // console.log("Face Data:", faceData);

      // console.log(canvas.width, canvas.height);
    }
  }
}
