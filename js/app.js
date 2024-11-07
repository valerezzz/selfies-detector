import Utils from "./utils.js";

export default class App {
  constructor() {
    this.init();

    this.utils = new Utils();
  }

  async init() {
    console.log("App init");
  }
}
