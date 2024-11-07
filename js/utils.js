import {
  FaceDetector,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

export default class Utils {
  constructor() {
    this.init();
  }

  async init() {
    console.log("Utils init");

    const video = document.getElementById("webcam");

    let faceDetector;
    let runningMode = "VIDEO";

    // Initialiser le détecteur de visages
    const initializeFaceDetector = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
          delegate: "GPU",
        },
        runningMode: runningMode,
      });
    };
    await initializeFaceDetector();

    // Vérifie si le navigateur supporte la webcam
    const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

    if (hasGetUserMedia()) {
      enableCam();
    } else {
      console.warn("getUserMedia() is not supported by your browser");
    }

    // Fonction pour activer la webcam
    async function enableCam() {
      if (!faceDetector) {
        alert("Face Detector is still loading. Please try again.");
        return;
      }

      const constraints = {
        video: true,
      };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
          video.srcObject = stream;
          video.addEventListener("loadeddata", predictWebcam);
        })
        .catch((err) => {
          console.error(err);
        });
    }

    // Fonction pour effectuer la détection sur la vidéo de la webcam
    async function predictWebcam() {
      if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await faceDetector.setOptions({ runningMode: "VIDEO" });
      }

      let startTimeMs = performance.now();
      const detections = await faceDetector.detectForVideo(video, startTimeMs);

      displayVideoDetections(detections);

      // Continue la détection
      window.requestAnimationFrame(predictWebcam);
    }

    function displayVideoDetections(detections) {
      const liveView = document.getElementById("liveView");

      // Assurez-vous que liveView a une position relative pour que les éléments enfants se positionnent correctement
      liveView.style.position = "relative";

      // Supprime les annotations précédentes
      while (liveView.firstChild) {
        liveView.removeChild(liveView.firstChild);
      }

      // Vérifie si 'detections.detections' est un tableau ou un objet itérable
      if (Array.isArray(detections.detections)) {
        // Affiche chaque détection
        for (let detection of detections.detections) {
          const p = document.createElement("p");
          p.innerText =
            "Confidence: " +
            Math.round(parseFloat(detection.categories[0].score) * 100) +
            "%";
          p.style = `
            position: absolute;
            left: ${detection.boundingBox.originX * video.offsetWidth}px;
            top: ${detection.boundingBox.originY * video.offsetHeight - 30}px;
          `;

          // Affichage du carré autour du visage
          const highlighter = document.createElement("div");
          highlighter.setAttribute("class", "highlighter");
          highlighter.style = `
            position: absolute;
            left: ${detection.boundingBox.originX * video.offsetWidth}px;
            top: ${detection.boundingBox.originY * video.offsetHeight}px;
            width: ${detection.boundingBox.width * video.offsetWidth}px;
            height: ${detection.boundingBox.height * video.offsetHeight}px;
            border: 2px solid red;
            pointer-events: none;
          `;
          liveView.appendChild(highlighter);
          liveView.appendChild(p);

          // Affiche les keypoints
          for (let keypoint of detection.keypoints) {
            const keypointEl = document.createElement("span");
            keypointEl.className = "key-point";

            // Calcul des positions en pixels pour afficher le keypoint
            keypointEl.style.top = `${keypoint.y * video.offsetHeight - 3}px`;
            keypointEl.style.left = `${keypoint.x * video.offsetWidth - 3}px`;

            // Applique un style pour les keypoints, vous pouvez ajuster les valeurs
            keypointEl.style.width = "6px"; // Taille du keypoint
            keypointEl.style.height = "6px"; // Taille du keypoint
            keypointEl.style.backgroundColor = "red"; // Couleur du keypoint
            keypointEl.style.position = "absolute"; // Position absolue par rapport à la vidéo

            liveView.appendChild(keypointEl);
          }
        }

        console.log("Detections:", detections.detections);
      } else {
        console.warn(
          "No face detections found or 'detections.detections' is not an array",
          detections
        );
      }
    }
  }
}
