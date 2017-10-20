const Guid = require("guid");
"use strict";

class SocketEmulator {
  constructor() {
    this.id = Guid.create().value;
    this.binaryType = "arraybuffer";
    this.readyState = 0;
    this.onerror = () => {};
    this.onopen = () => {};
    this.onmessage = () => {};
    this.send = () => {};
  }
}

module.exports = SocketEmulator;
