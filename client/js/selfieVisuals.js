const SMOOTHING_WINDOW = 5; // Nombre de valeurs à conserver pour le lissage
let rotationHistory = [];

export default class SelfieVisuals {
  constructor() {
    this.shapeCanvas = document.getElementById("shape_canvas");
    this.buttonShowDatas = document.getElementById("buttonShowDatas");
    this.modeVisuals = 1;
  }

  drawCanvasShape(ctx, canvasWidth, canvasHeight, currentData, referenceData) {
    switch (this.modeVisuals) {
      case 1:
        // console.log("Mode Visuals 1 FROM CANVAS SHAPE");
        ctx.rect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fill();

        if (this.buttonShowDatas.classList.contains("active_button_visual")) {
          console.log("Mode Visuals 1 FROM CANVAS SHAPE");
          ctx.beginPath();
          ctx.rect(canvasWidth / 2, 0, 10, canvasHeight);
          ctx.fillStyle = "rgba(0, 255, 0, 1)";
          ctx.fill();
          ctx.closePath();

          // Dessiner les cercles concentriques des photos de référence
          if (referenceData.Up) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"; // Très faible opacité
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2.08; // Même position Y que le cercle principal

            const photos = referenceData.Up.slice(0, 1);

            photos.forEach((photo) => {
              const eyeDistance = photo.detectorData.faceData.eyeDistance / 2;

              console.log("eyeDistance", eyeDistance);

              ctx.beginPath();
              ctx.arc(centerX, centerY, eyeDistance, 0, 2 * Math.PI);
              ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
              ctx.stroke();
              ctx.closePath();
            });
          }
        }
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        const eyeDistance = currentData.faceData.eyeDistance * 2.75;

        if (!this.smoothedEyeDistance) {
          this.smoothedEyeDistance = eyeDistance;
        }
        const lerpFactor = 0.25;
        this.smoothedEyeDistance +=
          (eyeDistance - this.smoothedEyeDistance) * lerpFactor;
        const smoothEyeDistance = this.smoothedEyeDistance;

        const mappedRadius =
          this.map(smoothEyeDistance, 900, 4000, 0, 4500) / 2;

        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2.08;

        ctx.beginPath();
        ctx.arc(centerX, centerY, mappedRadius, 0, 10 * Math.PI);
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fill();
        ctx.closePath();
        ctx.globalCompositeOperation = "difference";

        const allReferenceData = [];
        if (referenceData.Down && referenceData.Down.length > 0) {
          allReferenceData.push(...referenceData.Down);
        }
        if (referenceData.Up && referenceData.Up.length > 0) {
          allReferenceData.push(...referenceData.Up);
        }

        if (allReferenceData.length > 0) {
          const avgReferenceEyeDistance =
            allReferenceData.reduce((acc, data) => {
              return acc + data.detectorData.faceData.eyeDistance * 2;
            }, 0) / allReferenceData.length;
        }

        break;

      case 2:
        console.log("Mode Visuals 2 FROM CANVAS SHAPE");
        // Premier rectangle (rouge)
        ctx.beginPath();
        ctx.rect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fill();
        ctx.closePath();

        if (this.buttonShowDatas.classList.contains("active_button_visual")) {
          console.log("Mode Visuals 1 FROM CANVAS SHAPE");
          ctx.beginPath();
          ctx.rect(canvasWidth / 2, 0, 10, canvasHeight);
          ctx.fillStyle = "rgba(255, 0, 0, 1)";
          ctx.fill();
          ctx.closePath();
        }
        const pitchAngle = currentData.gyroscopeData.beta;

        // Mapper le pitchAngle (typiquement entre -90 et 90 degrés) vers la hauteur du rectangle
        const mappedHeight = this.map(
          pitchAngle,
          160, // angle minimum
          20, // angle maximum
          -canvasHeight / 2, // hauteur minimum
          canvasHeight / 2 // hauteur maximum
        );

        ctx.beginPath();
        ctx.rect(0, canvasHeight / 2, canvasWidth, mappedHeight);
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fill();
        ctx.closePath();

        break;
      case 3:
        // Fond bleu
        ctx.beginPath();
        ctx.rect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fill();
        ctx.closePath();

        if (this.buttonShowDatas.classList.contains("active_button_visual")) {
          console.log("Mode Visuals 1 FROM CANVAS SHAPE");
          ctx.beginPath();
          ctx.rect(canvasWidth / 2, 0, 10, canvasHeight);
          ctx.fillStyle = "rgba(0, 0, 255, 1)";
          ctx.fill();
          ctx.closePath();
        }

        // Parse les coordonnées des yeux
        const [rightEyeX, rightEyeY] = currentData.faceData.eyeRight
          .split(",")
          .map(Number);
        const [leftEyeX, leftEyeY] = currentData.faceData.eyeLeft
          .split(",")
          .map(Number);

        // Calcul de la nouvelle rotation
        const newRotation = Math.atan2(
          rightEyeY - leftEyeY,
          rightEyeX - leftEyeX
        );

        // Ajouter la nouvelle rotation à l'historique
        rotationHistory.push(newRotation);
        if (rotationHistory.length > SMOOTHING_WINDOW) {
          rotationHistory.shift(); // Supprime la plus ancienne valeur
        }

        // Calculer la moyenne des rotations
        const smoothedRotation =
          rotationHistory.reduce((a, b) => a + b, 0) / rotationHistory.length;

        // Supprimer la ligne existante de ArcAngle et ajouter :
        const startAngleFirst = -Math.PI / 2; // Commence à midi
        const endAngleFirst =
          smoothedRotation > 0
            ? startAngleFirst + Math.abs(smoothedRotation)
            : startAngleFirst - Math.abs(smoothedRotation);
        const radius = canvasHeight / 1.7; // Rayon de l'arc

        ctx.beginPath();
        ctx.moveTo(canvasWidth / 2, canvasHeight / 2);
        ctx.arc(
          canvasWidth / 2,
          canvasHeight / 2,
          radius,
          startAngleFirst,
          endAngleFirst,
          smoothedRotation < 0 // true si rotation négative (vers la gauche)
        );
        ctx.lineTo(canvasWidth / 2, canvasHeight / 2);
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fill();
        ctx.closePath();

        const startAngleSecond = Math.PI / 2;
        const endAngleSecond =
          smoothedRotation > 0
            ? startAngleSecond + Math.abs(smoothedRotation)
            : startAngleSecond - Math.abs(smoothedRotation);
        ctx.beginPath();
        ctx.moveTo(canvasWidth / 2, canvasHeight / 2);
        ctx.arc(
          canvasWidth / 2,
          canvasHeight / 2,
          radius,
          startAngleSecond,
          endAngleSecond,
          smoothedRotation < 0
        );
        ctx.lineTo(canvasWidth / 2, canvasHeight / 2);
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fill();
        ctx.closePath();

        // ctx.save();
        // ctx.translate(canvasWidth / 2, canvasHeight / 2);
        // ctx.rotate(smoothedRotation);
        // ctx.beginPath();
        // ctx.rect(-5, -canvasHeight / 1.7, 10, canvasHeight + 500);
        // ctx.fillStyle = "rgba(255, 255, 255, 1)";
        // ctx.fill();
        // ctx.closePath();
        // ctx.restore();

        break;
    }
  }

  map(value, start1, stop1, start2, stop2) {
    const mapped =
      ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
    return Math.max(start2, Math.min(stop2, mapped));
  }
}
