export default class PhotoCapture {
  constructor(cameraDetector) {
    this.cameraDetector = cameraDetector;
    this.takePictureButton = document.getElementById("takePicture");
    this.canvas = document.getElementsByClassName("output_canvas")[0];
    this.capturedData = [];

    this.initCapture();
  }

  initCapture() {
    this.takePictureButton.addEventListener("click", async () => {
      console.log("photoCapture");

      const captureObject = await this.captureData(); // Récupérer l'imageData depuis captureData

      const capturedImage = document.createElement("img");

      capturedImage.src = captureObject.imageData;
      capturedImage.classList.add("captured-image");
      capturedImage.style.width = 390 + "px";
      capturedImage.style.height = 693.333333 + "px";
      document.body.appendChild(capturedImage);

      setTimeout(() => {
        capturedImage.remove();
      }, 3000);
    });
  }

  async captureData() {
    console.log("Capture Data");

    const timeStamp = new Date().getTime();
    const fileName = `catpure_${timeStamp}.png`;

    const imageData = this.canvas.toDataURL("image/png");

    const detectorData = this.cameraDetector.getCurrentFaceData();

    const captureObject = {
      timestamp: timeStamp,
      imagePath: `./images/${fileName}`,
      imageData: imageData,
      ...detectorData,
    };

    console.log(captureObject);

    return captureObject;
  }
}
