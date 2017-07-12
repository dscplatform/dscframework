import Client from "./jsclient";

class BrowserClient extends Client {
  constructor(host) {
    super(window.WebSocket, host);
  }
}


export default BrowserClient;
