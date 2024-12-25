import { FaceMesh } from "@mediapipe/face_mesh";

export default class Utils {
  constructor() {
    this.currentFaceData = null;
    this.currentGyroscopeData = null;
  }

  initFaceMesh() {
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    return faceMesh;
  }

  initGyroscope(callback) {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === "granted") {
            this.calculateGyroscopeData(callback);
          }
        })
        .catch(console.error);
    } else {
      this.calculateGyroscopeData(callback);
    }
  }

  calculateFaceData(landmarks, canvasWidth, canvasHeight) {
    const px = (point) => ({
      x: point.x * canvasWidth,
      y: point.y * canvasHeight,
      z: point.z * canvasWidth,
    });

    const nose = px(landmarks[1]);
    const leftEye = px(landmarks[33]);
    const rightEye = px(landmarks[263]);
    const chin = px(landmarks[152]);

    // Vecteur utilisé pour le calcul du roll
    const eyeVector = {
      x: rightEye.x - leftEye.x,
      y: rightEye.y - leftEye.y,
      z: rightEye.z - leftEye.z,
    };

    // Normaliser le vecteur eyeVector pour le calcul du roll
    const eyeVectorLength = Math.sqrt(
      eyeVector.x * eyeVector.x +
        eyeVector.y * eyeVector.y +
        eyeVector.z * eyeVector.z
    );
    const normalizedEyeVector = {
      x: eyeVector.x / eyeVectorLength,
      y: eyeVector.y / eyeVectorLength,
      z: eyeVector.z / eyeVectorLength,
    };

    // Vecteur utilisé pour le calcul du pitch
    const noseToChinVector = {
      x: chin.x - nose.x,
      y: chin.y - nose.y,
      z: chin.z - nose.z,
    };

    // Point central entre les yeux, utilisé pour le calcul du yaw
    const eyeCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2,
      z: (leftEye.z + rightEye.z) / 2,
    };

    // Vecteur utilisé pour le calcul du yaw
    const noseToEyeCenterVector = {
      x: eyeCenter.x - nose.x,
      y: eyeCenter.y - nose.y,
      z: eyeCenter.z - nose.z,
    };

    // Angles
    const pitch = Math.atan2(-noseToChinVector.y, noseToChinVector.z);
    // Utiliser le vecteur normalisé pour le yaw
    const yaw = Math.atan2(noseToEyeCenterVector.x, -noseToEyeCenterVector.z);
    // Calculer le roll uniquement à partir du vecteur des yeux projeté sur le plan XY
    const roll = Math.atan2(normalizedEyeVector.y, normalizedEyeVector.x);

    let pitchdeg = Math.round((pitch * 180) / Math.PI) + 60;
    let yawdeg = Math.round((yaw * 180) / Math.PI) - 180;
    let rolldeg = Math.round((roll * 180) / Math.PI);

    // Normalisation de l'angle yaw entre -180° et +180°
    if (pitchdeg < -180) pitchdeg += 360;
    if (pitchdeg > 180) pitchdeg -= 360;

    if (yawdeg < -180) yawdeg += 360;
    if (yawdeg > 180) yawdeg -= 360;

    if (rolldeg < -180) rolldeg += 360;
    if (rolldeg > 180) rolldeg -= 360;

    const eyeDistance = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
    );

    // Bounding box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const point of landmarks) {
      const x = point.x * canvasWidth;
      const y = point.y * canvasHeight;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    const boxWidth = Math.round(maxX - minX);
    const boxHeight = Math.round(maxY - minY);
    const boxCenterX = Math.round(minX + boxWidth / 2);
    const boxCenterY = Math.round(minY + boxHeight / 2);

    this.currentFaceData = {
      pitch: pitchdeg,
      yaw: yawdeg,
      roll: rolldeg,
      eyeDistance: Math.round(eyeDistance),
      eyeLeft: Math.round(leftEye.x) + "," + Math.round(leftEye.y),
      eyeRight: Math.round(rightEye.x) + "," + Math.round(rightEye.y),
    };

    return this.currentFaceData;
  }

  calculateGyroscopeData(callback) {
    window.addEventListener("deviceorientation", (event) => {
      this.currentGyroscopeData = {
        alpha: Math.round(event.alpha) || 0,
        beta: Math.round(event.beta) || 0,
        gamma: Math.round(event.gamma) || 0,
      };

      callback(this.currentGyroscopeData);
    });
  }

  getCurrentData(currentFaceData, currentGyroscopeData, isTiltedDown) {
    return {
      faceData: currentFaceData,
      gyroscopeData: currentGyroscopeData,
      isTiltedDown: isTiltedDown,
    };
  }

  drawLandmarks(ctx, landmarks, canvasWidth, canvasHeight) {
    const px = (point) => ({
      x: point.x * canvasWidth,
      y: point.y * canvasHeight,
    });

    // Définir un tableau de couleurs primaires
    const primaryColors = [
      "rgb(255, 0, 0)", // Rouge
      "rgb(0, 0, 255)", // Bleu
      "rgb(255, 255, 0)", // Jaune
      "rgb(0, 255, 0)", // Vert
      "rgb(255, 0, 255)", // Magenta
      "rgb(0, 255, 255)", // Cyan
      "rgb(255, 255, 255)", // Blanc
    ];

    const nosePoint = px(landmarks[1]);
    const currentTime = performance.now() / 1000;
    // Changement de couleur toutes les 2 secondes
    const colorShift = Math.floor(currentTime / 0.2);

    landmarks.forEach((point, index) => {
      const pos = px(point);
      // Ajouter colorShift à l'index pour faire tourner les couleurs lentement
      const colorIndex = (index + colorShift) % primaryColors.length;
      const color = primaryColors[colorIndex];

      // ANIMATION
      const dx = pos.x - nosePoint.x;
      const dy = pos.y - nosePoint.y;
      const distance = Math.sqrt(
        Math.pow(dx * 1.5, 2) + Math.pow(dy * 1.05, 2)
      );
      const wave = Math.sin(currentTime * 3 - distance / 300);
      const isVisible = wave > 0;
      const alpha = isVisible ? 0.9 : 0;

      // Ajout de l'effet de lueur
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;

      // DRAW
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, 15, 8, 0, 0, 2 * Math.PI);
      ctx.fillStyle = color.replace("rgb", "rgba").replace(")", `, 1)`);
      ctx.fill();
      ctx.closePath();
    });

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    const leftEye = px(landmarks[33]);
    const rightEye = px(landmarks[263]);
  }

  async loadReferenceData() {
    const response = await fetch("/api/getReferenceData");
    this.referenceData = await response.json();
    console.log(this.referenceData);
    return this.referenceData;
  }
}
