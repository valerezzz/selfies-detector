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
    const front = px(landmarks[10]);

    // Vecteurs
    const eyeVector = {
      x: rightEye.x - leftEye.x,
      y: rightEye.y - leftEye.y,
      z: rightEye.z - leftEye.z,
    };
    const noseToChinVector = {
      x: chin.x - nose.x,
      y: chin.y - nose.y,
      z: chin.z - nose.z,
    };
    const noseToFrontVector = {
      x: front.x - nose.x,
      y: front.y - nose.y,
      z: front.z - nose.z,
    };

    // Angles
    const pitch = Math.atan2(noseToChinVector.y, -noseToChinVector.z);
    const yaw = Math.atan2(noseToFrontVector.x, -noseToFrontVector.z);
    const roll = Math.atan2(eyeVector.y, eyeVector.x);

    const pitchdeg = Math.round((pitch * 180) / Math.PI);
    const yawdeg = Math.round((yaw * 180) / Math.PI);
    const rolldeg = Math.round((roll * 180) / Math.PI);

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
      posX: boxCenterX,
      posY: boxCenterY,
      sizeX: boxWidth,
      sizeY: boxHeight,
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
  }
}
