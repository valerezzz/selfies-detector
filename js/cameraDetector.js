import Utils from "./utils.js";
import { Camera } from "@mediapipe/camera_utils";

export default class CameraDetector {
  constructor() {
    this.utils = new Utils();
    this.videoElement = document.getElementsByClassName("input_video")[0];
    this.canvasElement = document.getElementsByClassName("output_canvas")[0];
    this.canvasCtx = this.canvasElement.getContext("2d");
  }

  async init() {
    // Initialiser FaceMesh
    const faceMesh = await this.utils.initFaceMesh();

    // Configurer les dimensions du canvas
    this.canvasElement.width = 640; // ou la largeur souhaitée
    this.canvasElement.height = 480; // ou la hauteur souhaitée

    faceMesh.onResults((results) => {
      // Effacer le canvas
      this.canvasCtx.clearRect(
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      // Dessiner la vidéo sur le canvas
      this.canvasCtx.drawImage(
        results.image, // L'image retournée par FaceMesh
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        // Calculer les données faciales
        const data = this.utils.calculateFaceData(
          results.multiFaceLandmarks[0],
          this.canvasElement.width,
          this.canvasElement.height
        );

        console.log("Face Data:", data);

        // Dessiner les annotations
        this.utils.drawLandmarks(
          this.canvasCtx,
          results.multiFaceLandmarks[0],
          this.canvasElement.width,
          this.canvasElement.height
        );
      }
    });

    const camera = new Camera(this.videoElement, {
      onFrame: async () => {
        await faceMesh.send({ image: this.videoElement });
      },
      width: 640, // Largeur du flux vidéo
      height: 480, // Hauteur du flux vidéo
    });

    camera.start();
  }
}
