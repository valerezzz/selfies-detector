import Utils from "./utils.js";

export default class PoseComparator {
  constructor() {
    this.referenceData = [];
    this.lastMatchedImage = null;
    this.utils = new Utils();
    this.isRunning = false;

    this.init();

    // Définir les plages de valeurs pour la normalisation
    this.ranges = {
      pitch: { min: -90, max: 90 },
      yaw: { min: -90, max: 90 },
      roll: { min: -90, max: 90 },
      beta: { min: -180, max: 180 },
      gamma: { min: -90, max: 90 },
      alpha: { min: 0, max: 360 },
      eyeDistance: { min: 0, max: 1000 },
    };

    // Ajuster les poids pour chaque composante
    this.weights = {
      pitch: 1.5, // Plus important pour les mouvements verticaux
      yaw: 1.2, // Important pour les mouvements latéraux
      roll: 1.0, // Moins critique
      beta: 0.8, // Données gyroscope moins précises
      gamma: 0.8,
      alpha: 0.5, // Rotation moins importante
      eyeDistance: 1.2, // Important pour la distance
    };
  }

  async init() {
    this.isRunning = true;
    await this.utils.loadReferenceData();
    this.referenceData = this.utils.referenceData;
    console.log(this.referenceData);
  }

  // Normaliser une valeur entre 0 et 1
  normalize(value, min, max) {
    return (value - min) / (max - min);
  }

  // Calculer la différence entre deux angles normalisés
  compareAngles(current, reference, type, weight = 1) {
    const range = this.ranges[type];
    const normalizedCurrent = this.normalize(current, range.min, range.max);
    const normalizedReference = this.normalize(reference, range.min, range.max);

    // Gérer le cas spécial de l'alpha (360 degrés)
    if (type === "alpha") {
      let diff = Math.abs(normalizedCurrent - normalizedReference);
      if (diff > 0.5) diff = 1 - diff; // Prendre le plus court chemin
      return diff * weight;
    }

    return Math.abs(normalizedCurrent - normalizedReference) * weight;
  }

  calculatePoseDifference(current, reference) {
    if (!current || !reference) return Infinity;

    let totalDifference = 0;
    let totalWeight = 0;

    // Calculer les différences pour chaque composante
    const components = {
      pitch: [current.faceData.pitch, reference.faceData.pitch],
      yaw: [current.faceData.yaw, reference.faceData.yaw],
      roll: [current.faceData.roll, reference.faceData.roll],
      beta: [current.gyroscopeData.beta, reference.gyroscopeData.beta],
      gamma: [current.gyroscopeData.gamma, reference.gyroscopeData.gamma],
      alpha: [current.gyroscopeData.alpha, reference.gyroscopeData.alpha],
      eyeDistance: [
        current.faceData.eyeDistance,
        reference.faceData.eyeDistance,
      ],
    };

    // Calculer la différence pondérée pour chaque composante
    for (const [type, [curr, ref]] of Object.entries(components)) {
      const weight = this.weights[type];
      const difference = this.compareAngles(curr, ref, type, weight);
      totalDifference += difference;
      totalWeight += weight;
    }

    // Normaliser le score final
    return totalDifference / totalWeight;
  }

  findClosestPose(currentData) {
    if (!this.isRunning) return null;
    if (!currentData.faceData || !currentData.gyroscopeData) return null;

    let closestMatch = null;
    let smallestDifference = Infinity;
    let secondClosestDifference = Infinity;

    // Calculer les différences pour toutes les poses de référence
    const differences = this.referenceData.map((ref) => ({
      ref,
      difference: this.calculatePoseDifference(currentData, ref.detectorData),
    }));

    // Trier les différences
    differences.sort((a, b) => a.difference - b.difference);

    // Vérifier si la meilleure correspondance est significativement meilleure
    if (differences.length > 0) {
      const bestMatch = differences[0];
      const secondBest = differences[1];

      // Seuil de confiance : la meilleure correspondance doit être au moins 20% meilleure
      const confidenceThreshold = 0.2;

      if (
        secondBest &&
        bestMatch.difference / secondBest.difference < 1 - confidenceThreshold
      ) {
        closestMatch = bestMatch.ref;
        smallestDifference = bestMatch.difference;
      }
    }

    // Ajouter des logs pour le débogage
    console.log("Meilleure correspondance:", {
      difference: smallestDifference,
      pose: closestMatch
        ? closestMatch.imagePath
        : "Aucune correspondance fiable",
    });

    return closestMatch;
  }

  stop() {
    this.isRunning = false;
  }
}
