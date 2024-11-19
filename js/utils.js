import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

export default class Utils {
  constructor() {
    this.canvasElement = document.getElementsByClassName("output_canvas")[0];
    this.canvasCtx = this.canvasElement.getContext("2d");

    this.videoElement = document.getElementsByClassName("input_video")[0];

    this.startButton = document.getElementById("startCameraButton");
    this.intro = document.getElementById("intro");

    this.startButton.addEventListener("click", async () => {
      this.intro.style.display = "none";

      this.init();
    });
  }

  async init() {
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => this.onResults(results));

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Redimensionner le canvas pour qu'il occupe toute la taille de l'écran
    this.canvasElement.width = width;
    this.canvasElement.height = height;

    const camera = new Camera(this.videoElement, {
      onFrame: async () => {
        await faceMesh.send({ image: this.videoElement });
      },
      facingMode: "user",
      width: this.canvasElement.width * 3,
      height: this.canvasElement.height,
    });
    camera.start();
  }

  async onResults(results) {
    console.log(results);

    const canvasCtx = this.canvasCtx;
    const canvasElement = this.canvasElement;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    if (results.multiFaceLandmarks) {
      console.log("FACES IS DETECT");
      console.log("Landmarks détectés :", results.multiFaceLandmarks);

      for (const landmarks of results.multiFaceLandmarks) {
        // Ajout de points pour vérifier les landmarks
        for (const point of landmarks) {
          this.canvasCtx.beginPath();
          this.canvasCtx.arc(
            point.x * this.canvasElement.width,
            point.y * this.canvasElement.height,
            2,
            0,
            2 * Math.PI
          );
          this.canvasCtx.fillStyle = "blue";
          this.canvasCtx.fill();
        }
      }
    }
    canvasCtx.restore();
  }
}
