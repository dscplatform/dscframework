

module.uint8ToJson = (arr) => {

  try {
    var str = module.exports.uint8ToString(arr);
    return JSON.parse(str);

  } catch (err) {
    console.log(err);
  }

  return null;
};

module.exports.uint8ToString = (array, start) => {
  var out, i, len, c;
  var char2, char3;

  out = "";
  len = array.length;
  i = start ? start : 0;
  while(i < len) {
    c = array[i++];
    switch(c >> 4)
    {
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
      // 0xxxxxxx
      out += String.fromCharCode(c);
      break;
      case 12: case 13:
      // 110x xxxx   10xx xxxx
      char2 = array[i++];
      out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
      break;
      case 14:
      // 1110 xxxx  10xx xxxx  10xx xxxx
      char2 = array[i++];
      char3 = array[i++];
      out += String.fromCharCode(((c & 0x0F) << 12) |
      ((char2 & 0x3F) << 6) |
      ((char3 & 0x3F) << 0));
      break;
    }
  }

  return out;
};

module.exports.stringToUint8 = (str) => {
  var arr = new Uint8Array(str.length), i = 0, len = str.length;
  for(; i < len; ++i){
    arr[i] = str.charCodeAt(i);
  }
  return arr;
};

module.exports.makePacket = (type, header, body) => {
  var bdata = null;

  if (body.constructor === Uint8Array) {
    bdata = body;
  } else {
    switch(typeof body) {
      case "string":
      bdata = module.exports.stringToUint8(body);
      break;
      default:
      bdata = module.exports.stringToUint8(JSON.stringify(body));
    }
  }

  var hdata = module.exports.stringToUint8(JSON.stringify(header));
  var msg = new Uint8Array(3 + hdata.length + bdata.length);

  msg[0] = type;
  msg[1] = hdata.length & 0xff;
  msg[2] = (hdata.length >> 0x8) && 0xff;
  msg.set(hdata, 3);
  msg.set(bdata, 3 + hdata.length);

  return msg;
};
