const Guid = require("guid");
"use strict";

class SocketEmulator {
  constructor() {
    this.id = Guid.create().value;
    this.binaryType = "arraybuffer";
    this.onerror = () => {};
    this.onopen = () => {};
    this.onmessage = () => {};
    this.send = () => {};
  }
}

module.exports = SocketEmulator;
