// from http://stackoverflow.com/questions/9407892/how-to-generate-random-sha1-hash-to-use-as-id-in-node-js#14869745
// str byteToHex(uint8 byte)
//   converts a single byte to a hex string 
function byteToHex (byte) {
  return ('0' + byte.toString(16)).slice(-2)
}

// from http://stackoverflow.com/questions/9407892/how-to-generate-random-sha1-hash-to-use-as-id-in-node-js#14869745
// str generateId(int len);
//   len - must be an even number (default: 40)
function generateId (len) {
  var arr = new Uint8Array((len || 40) / 2)
  window.crypto.getRandomValues(arr)
  return [].map.call(arr, byteToHex).join("")
}

module.exports = {
  byteToHex: byteToHex,
  generateId: generateId
}