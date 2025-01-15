export default class SelfieComparator {
  constructor(photoData) {
    this.matchedSelfie = document.getElementById("matched-selfie");

    this.photoData = photoData;
  }

  async init(photoData) {
    console.log("Photo data comparator:", photoData);
  }

  findMatchingSelfie(selfieData) {
    if (!selfieData || !this.photoData) return null;

    console.log("Données du selfie:", selfieData);

    // Récupérer la liste appropriée en fonction de isTiltedDown
    const referenceList = selfieData.isTiltedDown
      ? this.photoData.Down
      : this.photoData.Up;

    this.bestMatch = null;
    this.smallestDistance = Infinity;

    for (const photo of referenceList) {
      const difference = this.calculateDifference(
        selfieData,
        photo.detectorData
      );

      if (difference < this.smallestDistance) {
        this.smallestDistance = difference;
        this.bestMatch = photo;
      }
    }

    if (this.bestMatch) {
      this.matchedSelfie.src = this.bestMatch.src;
      return this.bestMatch;
    }

    return null;
  }

  calculateDifference(currentData, referenceData) {
    // Poids pour chaque composant de la comparaison
    const weights = {
      pitch: 3,
      yaw: 2.5,
      roll: 1.5,
      eyeDistance: 3,
      beta: 1.5,
      alpha: 1,
      gamma: 1.5,
    };

    const face1 = currentData.faceData;
    const face2 = referenceData.faceData;
    const gyro1 = currentData.gyroscopeData;
    const gyro2 = referenceData.gyroscopeData;

    // Calcul des différences pondérées
    const pitchDiff = Math.abs(face1.pitch - face2.pitch) * weights.pitch;
    const yawDiff = Math.abs(face1.yaw - face2.yaw) * weights.yaw;
    const rollDiff = Math.abs(face1.roll - face2.roll) * weights.roll;
    const eyeDistanceDiff =
      (Math.abs(face1.eyeDistance - face2.eyeDistance) / 100) *
      weights.eyeDistance;

    // Différences gyroscope
    const betaDiff = Math.abs(gyro1.beta - gyro2.beta) * weights.beta;
    const alphaDiff =
      Math.min(
        Math.abs(gyro1.alpha - gyro2.alpha),
        360 - Math.abs(gyro1.alpha - gyro2.alpha)
      ) * weights.alpha;
    const gammaDiff = Math.abs(gyro1.gamma - gyro2.gamma) * weights.gamma;

    // Score total de différence
    return (
      pitchDiff +
      yawDiff +
      rollDiff +
      eyeDistanceDiff +
      betaDiff +
      alphaDiff +
      gammaDiff
    );
  }
}
