import Utils from "./utils";
import SelfieAnalyse from "./selfieAnalyse";
import SelfieCapture from "./selfieCapture";
import SelfieComparator from "./selfieComparator";
export default class SelfieInteraction {
  constructor() {
    this.intro = document.getElementById("intro");
    this.matchedSelfieElement = document.getElementById("matched-selfie");

    this.startButton = document.getElementById("startButton");
    this.backButton = document.getElementById("backButton");
    this.videoContent = document.getElementById("videoContent");
    this.captureButton = document.getElementById("captureButton");

    this.canvasElement = document.getElementsByClassName("video_canvas")[0];
    this.utils = new Utils();
    this.selfieAnalyse = new SelfieAnalyse();
    this.selfieCapture = new SelfieCapture();

    this.comparisonInterval = null;
  }

  async init() {
    this.interface();
    this.sendSelfieToServer();

    const photoData = await this.utils.loadReferenceData();
    console.log("Photo data:", photoData);

    this.selfieComparator = new SelfieComparator(photoData);
    this.startSelfieComparison();
  }

  startSelfieComparison() {
    this.comparisonInterval = setInterval(() => {
      const selfieData = this.selfieAnalyse.getSelfieData();
      if (selfieData && this.selfieComparator) {
        const matchedSelfie =
          this.selfieComparator.findMatchingSelfie(selfieData);
        if (matchedSelfie) {
          console.log("Selfie correspondant trouvé:", matchedSelfie);
          this.updateMatchedSelfieDisplay(matchedSelfie);
        }
      }
    }, 100);
  }

  updateMatchedSelfieDisplay(matchedSelfie) {
    if (this.matchedSelfieElement && matchedSelfie.imagePath) {
      this.matchedSelfieElement.src = matchedSelfie.imagePath;
    }
  }

  sendSelfieToServer() {
    this.captureButton.addEventListener("click", async () => {
      console.log("Bouton capture cliqué");
      const selfieData = this.selfieAnalyse.getSelfieData();
      console.log("Données du selfie:", selfieData);

      try {
        const result = await this.selfieCapture.captureSelfie(
          this.canvasElement,
          selfieData
        );
        console.log("Réponse du serveur:", result);
      } catch (error) {
        console.error("Erreur lors de la capture:", error);
      }
    });
  }

  interface() {
    console.log("initInterface");
    this.startButton.addEventListener("click", async () => {
      this.intro.style.display = "none";
      this.videoContent.style.display = "flex";
      this.selfieAnalyse.init();
    });

    backButton.addEventListener("click", () => {
      intro.style.display = "flex";
      videoContent.style.display = "none";
    });
  }
}
