const Client = require("./jsclient");

class BrowserClient extends Client {
  constructor(host) {
    super(window.WebSocket, host);
  }
}

module.exports = BrowserClient;
