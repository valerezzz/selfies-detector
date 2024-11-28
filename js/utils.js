import { FaceMesh } from "@mediapipe/face_mesh";

export default class Utils {
  constructor() {}

  // Initialisation de FaceMesh
  async initFaceMesh() {
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

  // Calculer rotation, position et taille à partir des landmarks
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

    return {
      pitch: pitchdeg,
      yaw: yawdeg,
      roll: rolldeg,
      eyeDistance: Math.round(eyeDistance), // Distance en pixels entre les yeux
      eyeLeft: Math.round(leftEye.x) + "," + Math.round(leftEye.y), // Position de l'œil gauche
      eyeRight: Math.round(rightEye.x) + "," + Math.round(rightEye.y), // Position de l'œil droit
    };
  }

  drawLandmarks(ctx, landmarks, canvasWidth, canvasHeight) {
    const px = (point) => ({
      x: point.x * canvasWidth,
      y: point.y * canvasHeight,
    });

    for (const point of landmarks) {
      const pos = px(point);

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.closePath();
    }

    // Dessiner le trait entre les yeux
    const leftEye = px(landmarks[33]);
    const rightEye = px(landmarks[263]);

    ctx.beginPath();
    ctx.moveTo(leftEye.x, leftEye.y);
    ctx.lineTo(rightEye.x, rightEye.y);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  }
}
