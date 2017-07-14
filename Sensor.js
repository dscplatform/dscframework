const Constants = require("./Constants");
const Util = require("./Util");
"use strict";


class Sensor {

  constructor(name) {
    this.name = name;
    this.subscribers = [];
    this.input = {};
    this.output = {};
    this.socket = null;
  }

  setSocket(socket, data) {
    // TODO refuse to set socket if it exists, or not owns the secret
    this.socket = socket;
    if (socket !== null) {
      this.init(data);
      this.updateTransmissionRate();
    }
  }

  init(data) {
    try {
      var len = 3 + ((data[2] << 8) | data[1]);
      var str = Util.uint8ToString(data, len);
      var json = JSON.parse(str);

      if (json.input) this.input = json.input;
      if (json.output) this.output = json.output;

    } catch(err) {
      console.log(err);
    }
  }

  clear() {
    this.subscribers = [];
  }

  isSubscribed(ws) {
    var i = 0, len = this.subscribers.length;
    for(; i < len; i++) {
      if (ws === this.subscribers[i]) return true;
    }
    return false;
  }

  subscribeIndex(ws) {
    var i = 0, len = this.subscribers.length;
    for(; i < len; i++) {
      if (ws === this.subscribers[i]) return i;
    }
    return -1;
  }

  updateTransmissionRate() {
    if (this.socket === null || this.socket.readyState !== 1) return;

    var str = JSON.stringify({
      subscribers: this.subscribers.length
    });

    var body = Util.stringToUint8(str);
    this.socket.send(Util.makePacket(Constants.RATE, {id: this.name}, body));
  }

  subscribe(ws) {
    if (!this.isSubscribed(ws)) {
      this.subscribers.push(ws);
      this.updateTransmissionRate();
    }
  }

  unsubscribe(ws) {
    var idx = this.subscribeIndex(ws);
    if(idx !== -1) {
      this.subscribers.splice(idx, 1);
      this.updateTransmissionRate();
    }
  }

  broadcast(data) {
    var i = 0, len = this.subscribers.length;
    for(; i < len; i++) {
      this.subscribers[i].send(data);
    }
  }

  update(data) {
    if (this.socket === null) return;
    this.socket.send(data);
  }

  makeDescriptor() {
    return {
      input: this.input,
      output: this.output
    };
  }

  isEmpty() {
    return this.socket === null && this.subscribers.length === 0;
  }

}


module.exports = Sensor;
