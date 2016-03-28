/**
 * Serial transport. Uses devault Serial port on Arduino.
 * @constructor
 * @param {Objedt} opts
 */
function SerialTransport(opts) {
  if (!(this instanceof SerialTransport)) {
    return new SerialTransport(opts);
  }

  this.configuration = opts.configuration;
}

/**
 * Creates the configuration per the specified options.
 * Added to top of sketch file.
 * Not used for Serial
 */
SerialTransport.prototype.createConfigBlock = function () {
  return "";
};

/**
 * Transport initialization code at the beginning of the setup() function.
 * Not used for Serial
 */
SerialTransport.prototype.createInitBlock = function () {
  return "";
};

/**
 * @return {Boolean} true if configuration specifies controller pins to be ignored
 * Not used for Serial
 */
SerialTransport.prototype.hasIgnorePins = function () {
  return false;
};

/**
 * Ignore pins used by the transport controller so that Firmata will not attempt to modify them.
 * Not used for Serial
 */
SerialTransport.prototype.createPinIgnoreBlock = function () {
  return "";
};

/**
 * Stream begin - near the end of the setup() function
 */
SerialTransport.prototype.createBeginBlock = function () {
  var text = "";
  text += "  // Uncomment to save a couple of seconds by disabling the startup blink sequence.\n";
  text += "  // Firmata.disableBlinkVersion();\n";
  text += "  Firmata.begin(" + this.configuration.baud + ");\n\n";
  return text;
};

/**
 * Transport code at the beginning of the Arduino loop() function.
 * Not used for Serial
 */
SerialTransport.prototype.createLoopBeginBlock = function () {
  return "";
};

/**
 * Transport code at the end of the Arduino loop() function.
 * Not used for Serial
 */
SerialTransport.prototype.createLoopEndBlock = function () {
  return "";
};

/**
 * Create a debug function to report the transport connection status.
 * Not used for Serial
 */
SerialTransport.prototype.createDebugStatusFn = function () {
  return "";
};

SerialTransport.controllers = {};

module.exports = SerialTransport;
