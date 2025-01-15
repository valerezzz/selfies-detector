import Utils from "./utils";
import SelfieAnalyse from "./selfieAnalyse";
import SelfieCapture from "./selfieCapture";
import SelfieComparator from "./selfieComparator";
import SelfieVisuals from "./selfieVisuals";

export default class SelfieInteraction {
  constructor() {
    this.intro = document.getElementById("intro");
    this.matchedSelfieElement = document.getElementById("matched-selfie");

    this.startButton = document.getElementById("startButton");

    this.videoContent = document.getElementById("videoContent");
    this.captureButton = document.getElementById("captureButton");

    this.headerTitle = document.getElementById("headerTitle");

    this.buttonMode1Footer = document.getElementById("buttonMode1Footer");
    this.buttonMode2Footer = document.getElementById("buttonMode2Footer");
    this.buttonMode3Footer = document.getElementById("buttonMode3Footer");
    this.footerContent = document.getElementById("footerContent");

    this.buttonsVisuals = document.getElementById("buttons_visuals");
    this.buttonVisuals1 = document.getElementById("buttonVisuals1");
    this.buttonVisuals2 = document.getElementById("buttonVisuals2");
    this.buttonVisuals3 = document.getElementById("buttonVisuals3");

    this.isCapturing = false;

    this.mode = 1;
    this.canvasElement = document.getElementsByClassName("video_canvas")[0];
    this.utils = new Utils();
    this.selfieAnalyse = new SelfieAnalyse();
    this.selfieCapture = new SelfieCapture();
    this.selfieVisuals = new SelfieVisuals();
    this.comparisonInterval = null;

    this.modeVisuals = 1;
  }

  async init() {
    this.interface();
    this.sendSelfieToServer();

    const photoData = await this.utils.loadReferenceData();
    console.log("Photo data:", photoData);

    this.selfieComparator = new SelfieComparator(photoData);
    this.selfieAnalyse.setReferenceData(photoData);
  }

  menuModeSwitch() {
    switch (this.mode) {
      case 1:
        this.stopSelfieComparison();
        this.matchedSelfieElement.style.display = "none";
        console.log("Mode 1");
        this.buttonMode1Footer.classList.add("active__button");
        this.buttonMode2Footer.classList.remove("active__button");
        this.buttonMode3Footer.classList.remove("active__button");
        this.footerContent.style.left = "75%";
        this.selfieAnalyse.selfieLandmarks.animMode = 1;
        this.selfieAnalyse.currentMode = 1;
        this.captureButton.style.display = "flex";
        this.buttonsVisuals.style.display = "none";
        break;
      case 2:
        this.stopSelfieComparison();
        this.startSelfieComparison();
        this.matchedSelfieElement.style.display = "flex";
        console.log("Mode 2");
        this.buttonMode1Footer.classList.remove("active__button");
        this.buttonMode2Footer.classList.add("active__button");
        this.buttonMode3Footer.classList.remove("active__button");
        this.footerContent.style.left = "50%";
        this.buttonsVisuals.style.display = "none";
        this.selfieAnalyse.selfieLandmarks.animMode = 3;
        this.selfieAnalyse.currentMode = 2;
        this.captureButton.style.display = "none";
        break;
      case 3:
        this.stopSelfieComparison();
        this.matchedSelfieElement.style.display = "none";
        console.log("Mode 3");
        this.buttonMode1Footer.classList.remove("active__button");
        this.buttonMode2Footer.classList.remove("active__button");
        this.buttonMode3Footer.classList.add("active__button");
        this.footerContent.style.left = "30%";

        this.selfieAnalyse.selfieLandmarks.animMode = 3;
        this.selfieAnalyse.currentMode = 3;
        this.captureButton.style.display = "none";
        this.buttonsVisuals.style.display = "flex";
        break;
    }
  }

  buttonVisualsSwitch() {
    switch (this.modeVisuals) {
      case 1:
        console.log("Mode Visuals 1");
        this.buttonVisuals1.classList.add("active_button_visual");
        this.buttonVisuals2.classList.remove("active_button_visual");
        this.buttonVisuals3.classList.remove("active_button_visual");
        this.selfieVisuals.modeVisuals = 1;
        this.selfieAnalyse.currentVisualMode = 1; // Ajouter cette ligne

        break;
      case 2:
        console.log("Mode Visuals 2");
        this.buttonVisuals1.classList.remove("active_button_visual");
        this.buttonVisuals2.classList.add("active_button_visual");
        this.buttonVisuals3.classList.remove("active_button_visual");
        this.selfieVisuals.modeVisuals = 2;
        this.selfieAnalyse.currentVisualMode = 2; // Ajouter cette ligne

        break;
      case 3:
        console.log("Mode Visuals 3");
        this.buttonVisuals1.classList.remove("active_button_visual");
        this.buttonVisuals2.classList.remove("active_button_visual");
        this.buttonVisuals3.classList.add("active_button_visual");
        this.selfieVisuals.modeVisuals = 3;

        this.selfieAnalyse.currentVisualMode = 3; // Ajouter cette ligne

        break;
    }
  }

  interface() {
    console.log("initInterface");
    this.startButton.addEventListener("click", async () => {
      console.log("startButton");
      this.intro.style.display = "none";
      this.videoContent.style.display = "flex";
      this.selfieAnalyse.init();
    });

    this.buttonMode1Footer.addEventListener("click", () => {
      this.mode = 1;
      console.log("this.mode", this.mode);
      this.menuModeSwitch();
    });
    this.buttonMode2Footer.addEventListener("click", () => {
      this.mode = 2;
      console.log("this.mode", this.mode);
      this.menuModeSwitch();
    });
    this.buttonMode3Footer.addEventListener("click", () => {
      this.mode = 3;
      console.log("this.mode", this.mode);
      this.menuModeSwitch();
    });

    this.buttonVisuals1.addEventListener("click", () => {
      this.modeVisuals = 1;
      this.buttonVisualsSwitch();
    });
    this.buttonVisuals2.addEventListener("click", () => {
      this.modeVisuals = 2;
      this.buttonVisualsSwitch();
    });
    this.buttonVisuals3.addEventListener("click", () => {
      this.modeVisuals = 3;
      this.buttonVisualsSwitch();
    });
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

  stopSelfieComparison() {
    clearInterval(this.comparisonInterval);
  }

  updateMatchedSelfieDisplay(matchedSelfie) {
    if (this.matchedSelfieElement && matchedSelfie.imagePath) {
      this.matchedSelfieElement.src = matchedSelfie.imagePath;
    }
  }

  sendSelfieToServer() {
    this.captureButton.addEventListener("click", async () => {
      this.isCapturing = !this.isCapturing;

      if (this.isCapturing) {
        console.log("Bouton capture cliqué");
        console.log("Début de la capture");
        this.selfieAnalyse.selfieLandmarks.animMode = 2;

        const captureInterval = setInterval(async () => {
          if (!this.isCapturing) {
            clearInterval(captureInterval);
            return;
          }
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
        }, 200);
      }
    });
  }
}
