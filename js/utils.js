import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export default class Utils {
  constructor() {
    this.vision = null;
    this.faceDetector = null;
    this.imageTest = document.getElementById("imageTest");

    this.init();
  }

  async init() {
    console.log("Utils class is initialized");

    await this.initializeFaceDetection();

    console.log("Face detection is initialized");

    this.detectFaceImage(this.imageTest);
  }

  async initializeFaceDetection() {
    this.vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );

    this.faceDetector = await FaceDetector.createFromOptions(this.vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "GPU",
        runningMode: "IMAGE",
        minDetectionConfidence: 0.5,
        minSuppressionThreshold: 0.3,
      },
    });
  }

  async detectFaceImage(image) {
    const detectionsImage = await this.faceDetector.detect(image);
    console.log("Face detection Image results:", detectionsImage);
    return detectionsImage;
  }

  // async detectFaceVideo(video) {
  //   const startTimeMs = performance.now();
  //   const detectionsVideo = await this.faceDetector.detect(video, startTimeMs);
  //   console.log("Face detection Video results:", detectionsVideo);
  //   return detectionsVideo;
  // }
}
