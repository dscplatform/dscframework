"use strict";

class Subscriber {

  constructor(ws, balance) {
    this.socket = ws;
    this.balanced = balance ? balance : false;
  }

  send(data) {
    this.socket.send(data);
  }
  
}

module.exports = Subscriber;
