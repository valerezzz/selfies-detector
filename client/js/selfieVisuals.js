const SMOOTHING_WINDOW = 5; // Nombre de valeurs à conserver pour le lissage
let rotationHistory = [];

export default class SelfieVisuals {
  constructor() {
    this.shapeCanvas = document.getElementById("shape_canvas");
    this.modeVisuals = 1;
  }

  drawCanvasShape(ctx, canvasWidth, canvasHeight, currentData, referenceData) {
    switch (this.modeVisuals) {
      case 1:
        console.log("Mode Visuals 1 FROM CANVAS SHAPE");
        ctx.rect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fill();

        const eyeDistance = currentData.faceData.eyeDistance * 2.75;

        if (!this.smoothedEyeDistance) {
          this.smoothedEyeDistance = eyeDistance;
        }
        const lerpFactor = 0.25;
        this.smoothedEyeDistance +=
          (eyeDistance - this.smoothedEyeDistance) * lerpFactor;
        const smoothEyeDistance = this.smoothedEyeDistance;

        const mappedRadius =
          this.map(smoothEyeDistance, 900, 4000, 0, 4000) / 2;

        const centerX = canvasWidth / 2;
        const centerY = canvasHeight * 0.43;

        ctx.beginPath();
        ctx.arc(centerX, centerY, mappedRadius, 0, 10 * Math.PI);
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fill();
        ctx.closePath();
        ctx.globalCompositeOperation = "difference";

        ctx.save();
        ctx.scale(-1, 1);
        ctx.font = "100px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";

        ctx.fillText(
          `${Math.round(smoothEyeDistance)}px`,
          -centerX,
          centerY + 25
        );
        ctx.restore();
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

          ctx.beginPath();
          ctx.arc(
            centerX,
            centerY,
            avgReferenceEyeDistance / 2,
            0,
            10 * Math.PI
          );
          ctx.fillStyle = "rgba(255, 255, 255, 1)";
          ctx.fill();
          ctx.closePath();
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

        // Rectangle bleu avec effet de perspective
        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);

        // Simuler une perspective en modifiant la hauteur en fonction du pitch
        const pitchAngle = currentData.gyroscopeData.beta;
        const scaleY = Math.cos((pitchAngle * Math.PI) / 180);

        // Appliquer la transformation
        ctx.scale(1, scaleY);

        // Dessiner le rectangle
        ctx.beginPath();
        ctx.rect(
          -canvasWidth / 2,
          -canvasHeight / 2,
          canvasWidth,
          canvasHeight
        );
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fill();
        ctx.closePath();
        ctx.restore();

        break;

      case 3:
        console.log("Mode Visuals 3 FROM CANVAS SHAPE");
        // Fond bleu
        ctx.beginPath();
        ctx.rect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fill();
        ctx.closePath();

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

        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.rotate(smoothedRotation);
        // Dessine le rectangle rouge
        ctx.beginPath();
        ctx.rect(-5, -canvasHeight / 2, 10, canvasHeight);
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fill();
        ctx.closePath();
        // Restaure le contexte
        ctx.restore();

        break;
    }
  }

  map(value, start1, stop1, start2, stop2) {
    const mapped =
      ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
    return Math.max(start2, Math.min(stop2, mapped));
  }
}
