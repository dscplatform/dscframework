import websockets
import sys
import struct
import asyncio
import numpy as np
import uuid
import json

# TODO attempt reconnect on connection failure
class Client:
    CONST_REGISTER = 0x1
    CONST_DEREGISTER = 0x2
    CONST_SUBSCRIBE = 0x3
    CONST_UNSUBSCRIBE = 0x4
    CONST_BROADCAST = 0x5
    CONST_UPDATE = 0x6
    CONST_RATE = 0x7
    CONST_EVENT = 0x8

    def __init__(self, host):
        self.host = host
        self.socket = None
        self.subs = {}
        self.sensors = {}
        self.graph = {}
        self.event_handler = None

    async def start(self, call, **kwargs):
        if "on_event" in kwargs:
            self.event_handler = kwargs["on_event"]
        async with websockets.connect(self.host) as socket:
            self.socket = socket;
            await call(self)
            await self.on_open()
            return self

    # TODO should body decode to bytes or numpy really?
    async def on_open(self):
        while True:
            msg = await self.socket.recv()
            mtype, header, body = self.deserialize(msg)
            if mtype == self.CONST_BROADCAST:
                await self.on_broadcast(header, body)
            elif mtype == self.CONST_UPDATE:
                await self.on_update(header, body)
            elif mtype == self.CONST_RATE:
                await self.on_rate(header, body)
            elif mtype == self.CONST_EVENT:
                await self.on_event(header, body);
            else:
                print("Recieved a misformed / unsupported message type")

    async def send(self, type, header, body):
        await self.socket.send(self.serialize(type, header, body))

    def serialize(self, msgtype, header, body):
        hdata = json.dumps(header)
        return (msgtype).to_bytes(1, byteorder="little") + len(hdata).to_bytes(2, byteorder="little") + (hdata + body).encode("utf-8")

    def deserialize(self, msg):
        msgtype, hlen = struct.unpack("=BH", msg[0:3])
        hend = hlen + 3
        header = json.loads(msg[3:hend].decode("utf-8"))
        body = msg[hend::]
        return (msgtype, header, body)

    async def register(self, id, descriptor, call):
        guid = uuid.uuid4()
        body = json.dumps(descriptor)
        self.sensors[id] = {"guid": guid, "callback": call, "subscribers": 0}
        await self.send(self.CONST_REGISTER, {"id": id}, body)
        return guid

    async def deregister(self, id):
        del self.sensors[id]
        await self.send(self.CONST_DEREGISTER, {"id": id}, "")

    async def subscribe(self, id, *args):
        call = args[len(args) - 1]
        if id in self.subs:
            self.subs[id].append(call)
        else:
            self.subs[id] = [call]
            await self.send(self.CONST_SUBSCRIBE, {"id": id, "balance": len(args) > 1 ? args[0] : False}, "")

    async def unsubscribe(self, id, call):
        if id in self.subs:
            if call in self.subs[id]:
                self.subs[id].remove(call)
            if len(self.subs[id]) == 0:
                await self.send(self.CONST_UNSUBSCRIBE, {"id": id}, "")

    async def broadcast(self, id, head, data):
        if id in self.sensors and self.sensors[id]["subscribers"] is not 0:
            chid = str(uuid.uuid4())
            if head is None:
                head = {"id": id, ch: [chid], df: {}}
            else:
                head["id"] = id
                head["ch"].append(chid)
            await self.send(self.CONST_BROADCAST, head, data)
            return chid
        else:
            return None

    async def update(self, name, data):
        pass

    async def on_broadcast(self, head, body):
        if head["id"] in self.subs:
            for call in self.subs[head["id"]]:
                await call(head, body)

    async def on_update(self, header, body):
        pass

    async def on_rate(self, head, body):
        if head["id"] in self.sensors:
            sensor = self.sensors[head["id"]]
            rdata = json.loads(body.decode("utf-8"))
            sensor["subscribers"] = rdata["subscribers"]

    async def on_event(self, head, body):
        event = json.loads(body.decode("utf-8"))
        if head["type"] == "gsync":
            self.graph = event;
        if self.event_handler is not None:
            self.event_handler(head.type, event)
