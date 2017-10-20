const WebSocket = require("ws");
const guid = require("guid");
const Sensor = require("./Sensor");
const Constants = require("./Constants");
const Util = require("./Util");
const SocketEmulatorPair = require("./common/SocketEmulatorPair");
const JSClient = require("./clients/jsclient");
"use strict";


class Server { // TODO add local subscribe and publish ability

  constructor(server) {
    this.sensors = new Map();
    this.clients = [];
    this.gc = [];
    this.server = server;
    this.wss = null;
  }

  clear() {
    this.sensors = new Map();
    this.subscriptions = new Map();
  }

  start() {
    if (this.wss !== null) throw "Already Started";
    this.wss = new WebSocket.Server({ server: this.server });
    this.wss.on("connection", (ws) => this.onConnection(ws));
  }

  stop(call) {
    if (this.wss === null) throw "Not started";

    this.wss.close(
      (err) => {
        this.wss = null;
        this.clear();
        call(err);
      }
    );
  }

  getLocalClient() {
    var pair = new SocketEmulatorPair();
    pair.connect();
    this.onConnection(pair.sockOutput);
    return new JSClient(pair.sockInput, "localhost");
  }

  onConnection(ws) {
    this.clients.push(ws);
    ws.send(this.makeGraphSyncPacket());
    ws.onmessage = (msg) => this.onMessage(ws, msg);
    ws.onclose = () => this.onClose(ws);
    ws.onerror = () => {};
  }

  /**
  * Cleanup Disconnected socket
  *
  * @this {Server}
  */
  onClose(ws) {
    for (var [key, value] of this.sensors.entries()) {
      value.unsubscribe(ws);
      if (value.isEmpty()) this.sensors.delete(key);
    }

    var len = this.clients.length, i = 0;
    for(; i < len; i++) {
      if (this.clients[i] === ws) {
        this.clients.splice(i, 1);
        break;
      }
    }
  }

  onMessage(ws, buf) {
    try {

      var msg = new Uint8Array(buf);
      var msgType = msg[0];
      var msgHeaderSize = (msg[2] << 8) | msg[1];
      var msgHeader = msg.subarray(3, 3 + msgHeaderSize);
      var header = JSON.parse(Util.uint8ToString(msgHeader));

      switch(msgType) {

        case Constants.REGISTER:
        this.registerSensor(ws, header, msg);
        break;

        case Constants.UNREGISTER:
        this.deregisterSensor(ws, header, msg);
        break;

        case Constants.BROADCAST:
        this.broadcastSensor(ws, header, msg);
        break;

        case Constants.UPDATE:
        this.updateSensor(ws, header, msg);
        break;

        case Constants.SUBSCRIBE:
        this.registerSubscription(ws, header, msg);
        break;

        case Constants.UNSUBSCRIBE:
        this.deregisterSubscription(ws, header, msg);
        break;

        default:
        console.log("got a message with a invalid type", msgType, header);

      }

    } catch (err) {
      console.error(err);
    }
  }

  // Sensors //

  /**
  * Register client as a subscribable sensor
  *
  * @this {Server}
  * @param {WebSocket} ws
  * @param {object} data {type: register, payload: {title, output, input, transform}}
  */
  registerSensor(ws, header, data) {
    if (!this.sensors.has(header.id)) {
      this.sensors.set(header.id, new Sensor(header.id));
    }

    this.sensors.get(header.id).setSocket(ws, data);
    var packet = this.makeGraphSyncPacket();
    var len = this.clients.length, i = 0;

    for(; i < len; i++) {
      this.clients[i].send(packet);
    }
  }

  deregisterSensor(ws, header, data) {
    if (!this.sensors.has(header.id)) return;

    var s = this.sensors.get(header.id);
    s.setSocket(null);
    this.sensors.remove(header.id);
    var packet = this.makeGraphSyncPacket();
    var len = this.clients.length, i = 0;

    for(; i < len; i++) {
      this.clients[i].send(packet);
    }
  }

  /**
  * Broadcast incoming sensor data to the subscribers
  *
  * @this {Server}
  * @param {WebSocket} ws
  * @param {object} data {type: broadcast, payload: <data>}
  */
  broadcastSensor(ws, header, data) {
    if(!this.sensors.has(header.id)) return;
    var s = this.sensors.get(header.id);
    s.broadcast(data);
  }

  /**
  * Transmit a update signal to a registered sensor
  *
  * @this {Server}
  */
  updateSensor(ws, header, data) {
    if(!this.sensors.has(header.id)) return;
    var s = this.sensors.get(header.id);
    s.update(data);
  }


  // Subscriptions //

  registerSubscription(ws, header, data) {
    if (!this.sensors.has(header.id)) {
      this.sensors.set(header.id, new Sensor(header.id));
    }

    this.sensors.get(header.id).subscribe(ws, header);
  }

  deregisterSubscription(ws, header, data) {
    if(!this.sensors.has(header.id)) return;
    var s = this.sensors.get(header.id);
    s.unsubscribe(ws);
    if (s.isEmpty()) {
      this.sensors.delete(header.id);
    }
  }

  // Utility //
  makeGraphSyncPacket() {
    var map = {};
    for (var [key, value] of this.sensors.entries()) {
      map[key] = value.makeDescriptor();
    }
    var str = JSON.stringify(map);
    return Util.makePacket(Constants.EVENT, {type: "gsync"}, Util.stringToUint8(str));
  }

}

module.exports = Server;
