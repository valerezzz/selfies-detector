export default class SelfieLandmarks {
  constructor() {
    this.landmarksCanvas = document.getElementById("landmarks_canvas");
    this.animMode = 1;
    this.animTime = 0; // Ajouter un compteur de temps
    this.pointDelays = []; // Ajouter un tableau pour stocker les délais de chaque point
    this.previousMode = 1; // Ajouter une variable pour suivre le mode précédent
    this.transitionProgress = 0; // Ajouter une variable pour la transition
    this.scannerPosition = 0; // Commencer au haut de l'écran
    this.noiseOffsets = []; // Ajouter des offsets de bruit pour chaque point
    this.zones = Array(5)
      .fill()
      .map(() => ({
        x: Math.random(),
        y: Math.random(),
        radius: 0.1 + Math.random() * 0.2,
        speed: {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
        },
        phase: Math.random() * Math.PI * 2,
      }));
  }

  drawLandmarks(ctx, landmarks, canvasWidth, canvasHeight) {
    const px = (point) => ({
      x: point.x * canvasWidth,
      y: point.y * canvasHeight,
    });

    // Mettre à jour les positions des zones
    this.zones.forEach((zone) => {
      zone.x += zone.speed.x;
      zone.y += zone.speed.y;

      // Rebondir sur les bords
      if (zone.x < 0 || zone.x > 1) zone.speed.x *= -1;
      if (zone.y < 0 || zone.y > 1) zone.speed.y *= -1;

      // Mise à jour de la phase pour l'effet de pulsation
      zone.phase += 0.001;
    });

    // Réinitialiser le scanner si on change de mode
    if (this.previousMode !== this.animMode) {
      this.scannerPosition = 0; // Commencer directement au haut
      this.previousMode = this.animMode;
    }

    landmarks.forEach((point) => {
      const pos = px(point);

      switch (this.animMode) {
        case 1:
          // Calculer la distance à chaque zone et prendre la plus proche
          let maxOpacity = 0;
          this.zones.forEach((zone) => {
            const dx = pos.x / canvasWidth - zone.x;
            const dy = pos.y / canvasHeight - zone.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Ajouter un effet de pulsation subtil
            const pulsingRadius =
              zone.radius * (1 + 0.1 * Math.sin(zone.phase));

            if (distance < pulsingRadius) {
              // Transition douce aux bords de la zone
              const fadeEdge = 0.1;
              const opacity =
                1 -
                Math.max(0, (distance - (pulsingRadius - fadeEdge)) / fadeEdge);
              maxOpacity = Math.max(maxOpacity, opacity);
            }
          });

          this.color = `rgba(255, 0, 0, ${maxOpacity})`;
          break;
        case 2:
          const distanceFromScanner = Math.abs(
            pos.y - this.scannerPosition * canvasHeight
          );
          const transitionHeight = 1000; // Légèrement réduit pour une apparition plus nette au début

          const normalizedDistance = Math.max(
            0,
            Math.min(1, distanceFromScanner / transitionHeight)
          );
          const opacity = 1 - normalizedDistance * normalizedDistance;

          this.color = `rgba(0, 0, 255, ${opacity})`;
          break;
        case 3:
          this.color = "rgba(255, 255, 0, 0)";
          break;
        default:
          this.color = "rgba(255, 255, 255, 1)";
      }

      ctx.shadowColor = this.color;
      ctx.shadowBlur = 30;

      // DRAW
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, 2.5, 8, 0, 0, 2 * Math.PI);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();
    });

    // Avancer la position du scanner
    if (this.animMode === 2) {
      if (this.scannerPosition < 1.2) {
        this.scannerPosition += 0.015;
      } else {
        // Au lieu de revenir à l'animMode 1, on réinitialise juste la position
        this.scannerPosition = 0;
      }
    }

    this.animTime = (this.animTime + 0.02) % 1;

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }
}
