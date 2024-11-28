import Utils from "./utils.js";

export default class ImagesDetector {
  constructor() {
    this.utils = new Utils();
    this.jsonData = [];
  }

  async processImages(files) {
    const faceMesh = await this.utils.initFaceMesh();

    for (const file of files) {
      const image = await this.loadImage(file);
      const results = await faceMesh.send({ image });

      if (results.multiFaceLandmarks) {
        const data = this.utils.calculateFaceData(
          results.multiFaceLandmarks[0],
          image.width,
          image.height
        );
        this.jsonData.push({ fileName: file.name, data });
      }
    }
    console.log("JSON Data:", this.jsonData);
  }

  async loadImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => resolve(img);
    });
  }
}
