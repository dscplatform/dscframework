const Client = require("./jsclient");
const ws = require("ws");

class NodeClient extends Client {
  constructor(host) {
    super(ws, host);
  }
}

module.exports = NodeClient;
