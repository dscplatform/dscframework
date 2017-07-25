const Constants = require("../Constants");
const Util = require("../Util");
const guid = require("guid");
const EventEmitter = require("events").EventEmitter;
const BROWSER = (typeof window !== "undefined" && typeof window.WebSocket !== "undefined");
var WS;
"use strict";


// TODO attempt reconnect if websocket failed
class Client extends EventEmitter {

  constructor(transport, addr) {
    super();
    if (typeof WS === "undefined") {
      WS = transport;
    }
    this.address = addr;
    this.socket = null;
    this.open = false;
    this.subscriptions = new Map();
    this.sensors = new Map();
    this.graph = new Map();
  }

  start(call) {
    if (this.socket === null) {
      this.socket = new WS(this.address);
      this.socket.binaryType = "arraybuffer";

      var open = ()=>{
        this.open = true;
        call();
      };

      if(BROWSER) {
        this.socket.onopen = open;
        this.socket.onmessage = (e) => this.onMessage(e.data);
      } else {
        this.socket.on("open", open);
        this.socket.on("message", (e) => this.onMessage(e));
      }
    }
  }

  onMessage(buf) {
    try {
      var msg = new Uint8Array(buf);
      var msgType = msg[0];
      var msgHeaderSize = (msg[2] << 8) | msg[1];
      var msgHeader = msg.subarray(3, 3 + msgHeaderSize);
      var header = JSON.parse(Util.uint8ToString(msgHeader));
      var body = msg.subarray(3 + msgHeaderSize);

      switch(msgType) {
        case Constants.BROADCAST:
        this.onBroadcast(header, body);
        break;

        case Constants.UPDATE:
        this.onUpdate(header, body);
        break;

        case Constants.RATE:
        this.onRate(header, body);
        break;

        case Constants.EVENT:
        this.onEvent(header, body);
        break;
      }

    } catch (err) {
      console.error(err);
    }
  }

  onBroadcast(head, data) {
    if (this.subscriptions.has(head.id)) {
      var arr = this.subscriptions.get(head.id);
      var i = 0, len = arr.length;
      for (; i < len; i++) {
        arr[i](head, data);
      }
    }
  }

  onUpdate(head, data) {
    if (this.sensors.has(head.id)) {
      var json = JSON.parse(Util.uint8ToString(data));
      this.sensors.get(name).callback(json);
    }
  }

  onRate(head, data) {
    try {
      if (this.sensors.has(head.id)) {
        var json = JSON.parse(Util.uint8ToString(data));
        this.sensors.get(head.id).subscribers = json.subscribers;
      }
    } catch(err) {
      console.log("ERR", err);
    }
  }

  onEvent(head, data) {
    var str = Util.uint8ToString(data);
    var body = JSON.parse(str);

    switch(head.type) {
      case "gsync":
      this.setGraph(body);
      break;
    }

    this.emit(head.type, body);
  }

  setGraph(g) {
    var keys = Object.keys(g), i = 0, map = new Map();
    for(; i < keys.length; i++) map.set(keys[i], g[keys[i]]);
    this.graph = map;
  }

  register(id, descriptor, call) {
    this.sensors.set(id, {
      guid: "",
      subscribers: 0,
      callback: call
    });
    var body = JSON.stringify(descriptor);
    this.send(Constants.REGISTER, {id: id}, Util.stringToUint8(body));
  }

  deregister(id) {
    if (this.sensors.has(id)) {
      this.sensors.remove(id);
      var str = JSON.stringify({ });
      this.send(Contants.DEREGISTER, {id: id}, Util.stringToUint8(str));
    }
  }

  broadcast(id, head, data) { // TODO mechanism to make this workflow as easy as possible
    if (this.sensors.has(id) && this.sensors.get(id).subscribers > 0) {
      var uuid = guid.create().value;
      if (head === null) {
        head = {
          id: id,
          ch: [uuid],
          df: {}
        };
      } else {
        head.id = id;
        head.ch.push(uuid)
      }

      this.send(Constants.BROADCAST, head, data);
      return head.ch[head.ch.length - 1];
    }
    return null;
  }

  subscribe(id, ...args) {
    var call = args[args.length - 1];
    if(this.subscriptions.has(id)) {
      this.subscriptions.get(id).push(call);
    } else {
      this.subscriptions.set(id, [call]);
      var str = JSON.stringify({ });
      this.send(Constants.SUBSCRIBE, {id: id, balance: args.length > 1 ? args[0] : false}, Util.stringToUint8(str));
    }
  }

  unsubscribe(id, call) {
    if(this.subscriptions.has(id)) {
      var arr = this.subscriptions.get(id);
      var idx = arr.indexOf(call);
      if (idx !== -1) arr.splice(idx, 1);

      if(arr.length === 0) {
        var str = JSON.stringify({ });
        this.send(Constants.UNSUBSCRIBE, {id: id}, Util.stringToUint8(str));
      }
    }
  }

  send(type, header, body) {
    if(!this.open) return;
    this.socket.send(Util.makePacket(type, header, body));
  }

}

module.exports = Client;
