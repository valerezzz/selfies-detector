import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import chalk from "chalk";

export default class Utils {
  constructor() {
    this.canvasElement = document.getElementsByClassName("output_canvas")[0];
    this.canvasCtx = this.canvasElement.getContext("2d");

    this.videoElement = document.getElementsByClassName("input_video")[0];

    this.startButton = document.getElementById("startCameraButton");
    this.intro = document.getElementById("intro");

    this.startButton.addEventListener("click", async () => {
      this.intro.style.display = "none";

      this.init();
    });
  }

  async init() {
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => this.onResults(results));
    const width = 390;
    const height = 745;

    this.canvasElement.width = width;
    this.canvasElement.height = height;

    const camera = new Camera(this.videoElement, {
      onFrame: async () => {
        await faceMesh.send({ image: this.videoElement });
      },
      facingMode: "user",
      width: width * 2,
      height: height,
    });
    camera.start();
  }

  async onResults(results) {
    const canvasCtx = this.canvasCtx;
    const canvasElement = this.canvasElement;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        // Points clés
        const nose = landmarks[1]; // Nez
        const leftEye = landmarks[33]; // Coin gauche de l'œil
        const rightEye = landmarks[263]; // Coin droit de l'œil
        const chin = landmarks[152]; // Menton
        const mouth = landmarks[13]; // Milieu de la bouche
        const front = landmarks[10]; // Front

        // Dimensions du canvas
        const width = canvasElement.width;
        const height = canvasElement.height;

        const px = (point) => ({
          x: point.x * width,
          y: point.y * height,
          z: point.z * width,
        });

        const nosePos = px(nose);
        const leftEyePos = px(leftEye);
        const rightEyePos = px(rightEye);
        const chinPos = px(chin);
        const mouthPos = px(mouth);
        const frontPos = px(front);

        //CALCUL DE LA ROTATION

        // Vecteur entre les yeux (gauche -> droite) ROLL
        const eyeVector = {
          x: rightEyePos.x - leftEyePos.x,
          y: rightEyePos.y - leftEyePos.y,
          z: rightEyePos.z - leftEyePos.z,
        };

        // Vecteur nez -> menton PITCH
        const noseToChinVector = {
          x: chinPos.x - nosePos.x,
          y: chinPos.y - nosePos.y,
          z: chinPos.z - nosePos.z,
        };

        // Vecteur nez -> front YAW
        const noseToFrontVector = {
          x: frontPos.x - nosePos.x,
          y: frontPos.y - nosePos.y,
          z: frontPos.z - nosePos.z,
        };

        // CALCUL DES ANGLES
        let pitch = Math.atan2(noseToChinVector.y, -noseToChinVector.z);
        let pitchdeg = Math.round((pitch * 180) / Math.PI);

        let yaw = Math.atan2(noseToFrontVector.x, -noseToFrontVector.z);
        let yawdeg = Math.round((yaw * 180) / Math.PI);

        let roll = Math.atan2(eyeVector.y, eyeVector.x); // Inclinaison latérale
        let rolldeg = Math.round((roll * 180) / Math.PI);

        // CALCUL DE LA BOUNDING BOX POS ET DIMENSIONS
        let minX = Infinity,
          minY = Infinity;
        let maxX = -Infinity,
          maxY = -Infinity;

        for (const point of landmarks) {
          const x = point.x * canvasElement.width;
          const y = point.y * canvasElement.height;

          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }

        const boxWidth = maxX - minX;
        const boxHeight = maxY - minY;
        const boxCenterX = minX + boxWidth / 2;
        const boxCenterY = minY + boxHeight / 2;

        // Variables contenant les dimensions

        console.log(chalk.white.bgBlue("SizeX head: ", boxWidth));
        console.log(chalk.white.bgBlue("SizeY head: ", boxHeight));

        console.log(chalk.white.bgRed("PosX head: ", boxCenterX));
        console.log(chalk.white.bgRed("PosY head:", boxCenterY));

        console.log(chalk.white.bgMagenta("Roll head: ", rolldeg, "°"));
        console.log(chalk.white.bgMagenta("Pitch head: ", pitchdeg, "°"));
        console.log(chalk.white.bgMagenta("Yaw head: ", yawdeg, "°"));

        // Dessiner le carré englobant
        canvasCtx.beginPath();
        canvasCtx.rect(minX, minY, boxWidth, boxHeight);
        canvasCtx.strokeStyle = "red";
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
        canvasCtx.closePath();

        // Dessiner les points clés
        const drawPoint = (point, color) => {
          canvasCtx.beginPath();
          canvasCtx.arc(point.x, point.y, 2.5, 0, 2 * Math.PI);
          canvasCtx.fillStyle = color;
          canvasCtx.fill();
        };

        for (const point of landmarks) {
          drawPoint(px(point), "blue");
        }

        drawPoint(nosePos, "yellow");
        drawPoint(leftEyePos, "yellow");
        drawPoint(rightEyePos, "yellow");
        drawPoint(chinPos, "yellow");
        drawPoint(mouthPos, "yellow");
        drawPoint(frontPos, "yellow");

        function drawArrow(ctx, start, end, color = "green") {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Ajouter une pointe à la flèche
          const arrowLength = 10;
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          ctx.lineTo(
            end.x - arrowLength * Math.cos(angle - Math.PI / 6),
            end.y - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - arrowLength * Math.cos(angle + Math.PI / 6),
            end.y - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }

        // Visualisation du vecteur pour le yaw
        drawArrow(canvasCtx, nosePos, frontPos, "blue");
      }
    }

    canvasCtx.restore();
  }
}
