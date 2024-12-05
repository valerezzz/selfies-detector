import Utils from "./utils.js";

export default class PoseComparator {
  constructor() {
    this.referenceData = [];
    this.utils = new Utils();

    this.init();
  }

  async init() {
    await this.utils.loadReferenceData();
    this.referenceData = this.utils.referenceData;
    console.log(this.referenceData);
  }
}
