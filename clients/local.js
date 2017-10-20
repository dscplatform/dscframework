const Client = require("./jsclient");
const sock = require("../SocketEmulator");

class LocalClient extends Client { // TODO, have the server work as a factory for this? pass in a socket emulator
  constructor(host) {
    super(sock, host);
  }
}

module.exports = LocalClient;
