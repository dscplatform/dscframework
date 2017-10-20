const SocketEmulator = require("./SocketEmulator");
"use strict";

class SocketEmulatorPair {

  constructor() {
    this.sockInput = new SocketEmulator();
    this.sockOutput = new SocketEmulator();
  }

  connect() {
    this.sockInput.send = (data) => this.sockOutput.onmessage({ data: data });
    this.sockOutput.send = (data) => this.sockInput.onmessage(data);
    this.sockInput.close = () => this.disconnect();
    this.sockOutput.close = () => this.disconnect();
    this.socketInput.onopen();
    this.socketOutputl.onopen();
  }

  disconnect() {
    this.sockInput.close();
    this.sockOutput.close();
  }

}

module.exports = SocketEmulatorPair;
