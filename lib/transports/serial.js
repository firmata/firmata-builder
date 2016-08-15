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
 * Report when the host connection state changes
 * Not used for Serial
 */
SerialTransport.prototype.createHostConnectionCallbackFn = function () {
  return "";
};

/**
 * Create a debug function to report the transport connection status.
 * Not used for Serial
 */
SerialTransport.prototype.createDebugStatusFn = function () {
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
SerialTransport.prototype.createIgnorePinsFn = function () {
  return "";
};

SerialTransport.prototype.createInitTransportFn = function () {
  var fn = "";
  fn += "void initTransport()\n";
  fn += "{\n";
  fn += "  // Uncomment to save a couple of seconds by disabling the startup blink sequence.\n";
  fn += "  // Firmata.disableBlinkVersion();\n";
  fn += "  Firmata.begin(" + this.configuration.baud + ");\n";
  fn += "}\n\n";
  return fn;
};

SerialTransport.controllers = {};

module.exports = SerialTransport;
