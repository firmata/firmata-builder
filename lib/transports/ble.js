var Controllers = {
  ARDUINO_101: {
    name: "Arduino 101",
    driver: "CurieBLE"
  },
  BLE_NANO: {
    name: "RedBearLab BLE Nano",
    driver: "BLEPeripheral"
  }
};

/**
 * BLE transport.
 * @constructor
 * @param {Object} opts
 */
function BLETransport(opts) {
  if (!(this instanceof BLETransport)) {
    return new BLETransport(opts);
  }

  this.configuration = opts.configuration;
  this.controller = Controllers[this.configuration.controller];
  if (!this.controller) {
    throw new Error("No valid BLE controller defined");
  }
}

/**
 * Creates the Ethernet configuration per the specified Etherent options.
 * Added to top of sketch file.
 */
BLETransport.prototype.createConfigBlock = function() {
  var config = "";
  var configuration = this.configuration;

  var MIN_INTERVAL = 6; // 7.5ms / 1.25 = 6
  var DEFAULT_MAX_INTERVAL = 24; // 30ms / 1.25 = 24
  var INTERVAL_INCREMENT = 1.25;
  var minInterval = configuration.minInterval;
  var maxInterval = configuration.maxInterval;

  config += "// Uncomment to enable debugging over Serial (9600 baud).\n";
  config += "//#define SERIAL_DEBUG\n";
  config += "#include \"utility/firmataDebug.h\"\n\n";

  switch (this.controller) {
  case Controllers.ARDUINO_101:
    config += "#include <CurieBLE.h>\n";
    break;
  case Controllers.BLE_NANO:
    config += "// BLE Nano support requires patching the RedBearLab nRF51822-Arduino\n";
    config += "// core library. See steps 1 - 3 in this gist for instructions:\n";
    config += "// https://gist.github.com/soundanalogous/d39bb3eb36333a0906df\n";
    config += "#include <BLEPeripheral.h>\n";
    break;
  }

  config += "#include \"utility/BLEStream.h\"\n\n";

  if (!minInterval || minInterval < MIN_INTERVAL) {
    minInterval = MIN_INTERVAL;
  }
  minInterval = Math.floor(minInterval);
  config += "// Specify min and max as time in ms / 1.25. The result must be an integer.\n"
  config += "// For example 7.5ms = 7.5 / 1.25 = 6.\n";
  config += "// Min interval cannot be < 6 (7.5ms / 1.25)\n";
  config += "#define FIRMATA_BLE_MIN_INTERVAL " + minInterval + " // interval = time in ms / 1.25\n";

  if (!maxInterval || maxInterval < minInterval) {
    maxInterval = DEFAULT_MAX_INTERVAL;
  }
  maxInterval = Math.floor(maxInterval);
  config += "#define FIRMATA_BLE_MAX_INTERVAL " + maxInterval + " // interval = time in ms / 1.25\n\n";

  if (!configuration.localName) {
    configuration.localName = "FIRMATA";
  }

  config += "// Change this to a unique name per board if running StandardFirmataBLE\n";
  config += "// on multiple boards within the same physical space.\n";
  config += "#define FIRMATA_BLE_LOCAL_NAME \"" + configuration.localName + "\"\n\n";

  config += "BLEStream stream;\n\n";

  return config;
};

/**
 * Transport code at the beginning of the Arduino loop() function.
 */
BLETransport.prototype.createLoopBeginBlock = function () {
  var text = "";
  text += "  // stream.poll() will send the TX buffer at the specified flush interval or when\n";
  text += "  // the buffer is full. It will return false if no BLE connection is established.\n";
  text += "  if (!stream.poll()) return;\n\n";
  return text;
};

/**
 * Transport code at the end of the Arduino loop() function.
 */
BLETransport.prototype.createLoopEndBlock = function () {
  return "";
};

/**
 * Report when the host connection state changes
 */
BLETransport.prototype.createHostConnectionCallbackFn = function () {
  return "";
};

/**
 * Create a debug function to report the transport connection status.
 */
BLETransport.prototype.createDebugStatusFn = function () {
  return "";
};

/**
 * @return {boolean} true if configuration specifies controller pins to be ignored
 */
BLETransport.prototype.hasIgnorePins = function () {
  return false;
};

/**
 * Ignore pins used by the transport controller so that Firmata will not attempt to modify them.
 */
BLETransport.prototype.createIgnorePinsFn = function () {
  return "";
};

BLETransport.prototype.createInitTransportFn = function () {
  var fn = "";
  fn += "void initTransport()\n";
  fn += "{\n";

  fn += "  // IMPORTANT: if SERIAL_DEBUG is enabled, program execution will stop\n";
  fn += "  // at DEBUG_BEGIN until a Serial connection is established.\n";
  fn += "  DEBUG_BEGIN(9600);\n\n";

  fn += "  stream.setLocalName(FIRMATA_BLE_LOCAL_NAME);\n";
  // set the BLE connection interval - this is the fastest interval you can read inputs
  fn += "  stream.setConnectionInterval(FIRMATA_BLE_MIN_INTERVAL, FIRMATA_BLE_MAX_INTERVAL);\n";
  fn += "  // Set how often the BLE TX buffer is flushed (if not full).\n";
  fn += "  stream.setFlushInterval(FIRMATA_BLE_MAX_INTERVAL);\n\n";

  fn += "  stream.begin();\n";
  fn += "  Firmata.begin(stream);\n";
  fn += "}\n\n";
  return fn;
};

BLETransport.controllers = Controllers;

module.exports = BLETransport;
