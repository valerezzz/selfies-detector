import CameraDetector from "./cameraDetector.js";
import ImagesDetector from "./imagesDetector.js";

export default class App {
  constructor() {
    this.init();
  }

  async init() {
    console.log("App init");

    const cameraDetector = new CameraDetector();
    const imageDetector = new ImagesDetector();

    const intro = document.getElementById("intro");

    document
      .getElementById("startCameraButton")
      .addEventListener("click", () => {
        cameraDetector.init();
        intro.style.display = "none";
      });

    document
      .getElementById("processImages")
      .addEventListener("click", async () => {
        const files = document.getElementById("imageUpload").files;
        if (files.length > 0) {
          await imageDetector.processImages(files);
        }
      });
  }
}
