export default class SelfieCanvas {
  constructor() {
    // Configuration des canvas
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
  }

  clearCanvases() {
    const {
      videoCanvasCtx,
      landmarksCanvasCtx,
      videoCanvasElement,
      landmarksCanvasElement,
    } = this;
    videoCanvasCtx.clearRect(
      0,
      0,
      videoCanvasElement.width,
      videoCanvasElement.height
    );
    landmarksCanvasCtx.clearRect(
      0,
      0,
      landmarksCanvasElement.width,
      landmarksCanvasElement.height
    );
  }

  drawVideo(results) {
    const { videoCanvasCtx, videoCanvasElement } = this;
    videoCanvasCtx.save();
    videoCanvasCtx.scale(-1, 1);
    videoCanvasCtx.translate(-videoCanvasElement.width, 0);

    if (results.image) {
      videoCanvasCtx.drawImage(
        results.image,
        0,
        0,
        videoCanvasElement.width,
        videoCanvasElement.height
      );
    }
    videoCanvasCtx.restore();
  }

  drawFacialFeatures(
    results,
    currentMode,
    selfieLandmarks,
    selfieVisuals,
    selfieData,
    referenceData
  ) {
    const { landmarksCanvasCtx, landmarksCanvasElement } = this;
    landmarksCanvasCtx.save();
    landmarksCanvasCtx.scale(-1, 1);
    landmarksCanvasCtx.translate(-landmarksCanvasElement.width, 0);

    if (results.multiFaceLandmarks?.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      this.drawModeSpecificFeatures(
        landmarks,
        currentMode,
        selfieLandmarks,
        selfieVisuals,
        selfieData,
        referenceData
      );
    } else {
      console.log("No landmarks found");
    }

    landmarksCanvasCtx.restore();
  }

  drawModeSpecificFeatures(
    landmarks,
    currentMode,
    selfieLandmarks,
    selfieVisuals,
    selfieData,
    referenceData
  ) {
    const { landmarksCanvasCtx, landmarksCanvasElement } = this;

    if (currentMode === 1) {
      selfieLandmarks.drawLandmarks(
        landmarksCanvasCtx,
        landmarks,
        landmarksCanvasElement.width,
        landmarksCanvasElement.height
      );
    } else if (currentMode === 3) {
      selfieVisuals.drawCanvasShape(
        landmarksCanvasCtx,
        landmarksCanvasElement.width,
        landmarksCanvasElement.height,
        selfieData,
        referenceData
      );
    }
  }
}
