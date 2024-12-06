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

      // Envoyer l'image au serveur
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageData: captureObject.imageData,
            timestamp: captureObject.timestamp,
            detectorData: captureObject.detectorData,
          }),
        });

        if (response.ok) {
          console.log("Image envoyée avec succès");
        } else {
          console.error("Erreur lors de l'envoi de l'image");
        }
      } catch (error) {
        console.error(
          "Erreur lors de la communication avec le serveur:",
          error
        );
      }

      const capturedImage = document.createElement("img");

      capturedImage.src = captureObject.imageData;
      capturedImage.classList.add("captured-image");
      capturedImage.style.width = 390 + "px";
      capturedImage.style.height = 693.333333 + "px";
      document.body.appendChild(capturedImage);

      setTimeout(() => {
        capturedImage.remove();
      }, 1000);
    });
  }

  async captureData() {
    console.log("Capture Data");

    const timeStamp = new Date().getTime();
    const fileName = `catpure_${timeStamp}.jpg`;

    const imageData = this.canvas.toDataURL("image/jpeg", 0.8);
    const detectorData = this.cameraDetector.getCurrentFaceData();

    const captureObject = {
      timestamp: timeStamp,
      imagePath: `./images/${fileName}`,
      imageData: imageData,
      detectorData: detectorData,
    };

    console.log(captureObject);

    return captureObject;
  }
}
