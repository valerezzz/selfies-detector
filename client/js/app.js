import CameraDetector from "./cameraDetector.js";
import PhotoCapture from "./photoCapture.js";

export default class App {
  constructor() {
    this.init();
  }

  async init() {
    console.log("App init");

    const cameraDetector = new CameraDetector();
    const photoCapture = new PhotoCapture(cameraDetector);
  }
}
