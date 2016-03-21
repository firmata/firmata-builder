/**
 * @constructor
 * @param {Objedt} opts
 */
function SerialTransport(opts) {
  if (!(this instanceof SerialTransport)) {
    return new SerialTransport(opts);
  }

  this.configuration = opts.configuration;
}

SerialTransport.prototype.createBeginBlock = function () {
  var text = "";
  text += "  // Uncomment to save a couple of seconds by disabling the startup blink sequence.\n";
  text += "  // Firmata.disableBlinkVersion();\n";
  text += "  Firmata.begin(" + this.configuration.baud + ");\n\n";
  return text;
};

SerialTransport.prototype.createInitBlock = function () {
  return "";
};

SerialTransport.prototype.hasIgnorePins = function () {
  return false;
};

SerialTransport.prototype.createPinIgnoreBlock = function () {
  return "";
};

SerialTransport.prototype.createConfigBlock = function () {
  return "";
};

SerialTransport.prototype.createLoopBeginBlock = function () {
  return "";
};

SerialTransport.prototype.createLoopEndBlock = function () {
  return "";
};

SerialTransport.prototype.createDebugStatusFn = function () {
  return "";
};

module.exports = SerialTransport;
