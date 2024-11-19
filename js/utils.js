import { FaceMesh } from "@mediapipe/face_mesh";

export default class Utils {
  constructor() {
    this.faceMesh = null;
    this.imageTest = document.getElementById("imageTest");
    this.square = document.getElementById("square");
    this.init();
  }

  async init() {
    console.log("Utils class is initialized");
    await this.initializeFaceMesh();
    console.log("Face Mesh is initialized");

    // Appel de la détection pour l'image
    this.detectFaceLandmarks(this.imageTest);
  }

  async initializeFaceMesh() {
    try {
      this.faceMesh = new FaceMesh({
        locateFile: (file) => {
          // Essaye de charger depuis le CDN
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });
    } catch (error) {
      console.warn("CDN failed, switching to local files", error);
      // Recharger avec la version locale si le CDN échoue
      this.faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `/local_mediapipe/${file}`;
        },
      });
    }

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // Définir le callback pour récupérer les résultats
    this.faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks) {
        this.calculateFaceOrientation(results.multiFaceLandmarks[0]);
        this.calculateHeadPositionAndSize(results.multiFaceLandmarks[0]);
      }
    });
  }

  async detectFaceLandmarks(image) {
    await this.faceMesh.send({ image });
  }

  calculateFaceOrientation(landmarks) {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const deltaX = rightEye.x - leftEye.x;
    const deltaY = rightEye.y - leftEye.y;
    const roll = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    console.log(`Face orientation (roll): ${roll}°`);
    this.square.style.transform = `rotate(${roll}deg)`;
  }

  calculateHeadPositionAndSize(landmarks) {
    // Points de référence pour la boîte englobante
    const leftTemple = landmarks[234];
    const rightTemple = landmarks[454];
    const chin = landmarks[152];
    const forehead = landmarks[10]; // Environ le haut du visage

    // Calcul de la position centrale de la tête
    const centerX = (leftTemple.x + rightTemple.x) / 2;
    const centerY = (forehead.y + chin.y) / 2;

    // Calcul de la taille estimée de la tête (distance entre menton et front)
    const headHeight = Math.sqrt(
      Math.pow(chin.x - forehead.x, 2) + Math.pow(chin.y - forehead.y, 2)
    );

    const headWidth = Math.sqrt(
      Math.pow(rightTemple.x - leftTemple.x, 2) +
        Math.pow(rightTemple.y - leftTemple.y, 2)
    );

    // Conversion des coordonnées et tailles relatives (0-1) vers les pixels de l'image
    const imageWidth = this.imageTest.width;
    const imageHeight = this.imageTest.height;

    const centerXPixels = centerX * imageWidth;
    const centerYPixels = centerY * imageHeight;
    const headWidthPixels = headWidth * imageWidth;
    const headHeightPixels = headHeight * imageHeight;

    console.log(
      `Head position (center): (${centerXPixels.toFixed(
        2
      )}, ${centerYPixels.toFixed(2)})`
    );
    console.log(
      `Head size: Width = ${headWidthPixels.toFixed(
        2
      )} px, Height = ${headHeightPixels.toFixed(2)} px`
    );

    //Définir la taille de la boîte englobante
    this.square.style.width = `${headWidthPixels}px`;
    this.square.style.height = `${headHeightPixels}px`;

    // Définir la position de la boîte englobante
    this.square.style.left = `${centerXPixels - headWidthPixels / 2}px`;
    this.square.style.top = `${centerYPixels - headHeightPixels / 2}px`;
  }
}
