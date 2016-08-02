var utils = require("../utils.js");

var Controllers = {
  WIZ5100: "WIZ5100",
  ENC28J60: "ENC28J60",
  "Arduino Yun": "Arduino Yun"
};

// TODO: fix this in firmatabuilder.com to flip key and value in drop down
var _controllers = {
  YUN: "Arduino Yun"
};

// Wiznet shield and board alias
[
  "Arduino Ethernet Shield",
  "Arduino Ethernet Board",
  "DFRobot X-Board V2",
  "Ethernet Shield W5100"
].forEach(function(alias) {
  Controllers[alias] = Controllers.WIZ5100;
});

/**
 * Ethernet transport. Currently configurable as client only on Arduino.
 * @constructor
 * @param {Objedt} opts
 */
function EthernetTransport(opts) {
  if (!(this instanceof EthernetTransport)) {
    return new EthernetTransport(opts);
  }

  this.configuration = opts.configuration;
  this.controller = "";

  switch (Controllers[this.configuration.controller]) {
  case Controllers.WIZ5100:
    this.controller = Controllers.WIZ5100;
    break;
  case Controllers.ENC28J60:
    this.controller = Controllers.ENC28J60;
    break;
  case Controllers["Arduino Yun"]:
    this.controller = _controllers.YUN;
    break;
  default:
    throw new Error("No valid Ethernet controller defined");
  }
}

/**
 * Creates the Ethernet configuration per the specified Etherent options.
 * Added to top of sketch file.
 */
EthernetTransport.prototype.createConfigBlock = function() {
  var config = "";
  var configuration = this.configuration;

  switch (this.controller) {
  case Controllers.WIZ5100:
    config += "#include <SPI.h>\n";
    config += "#include <Ethernet.h>\n";
    break;
  case Controllers.ENC28J60:
    config += "#include <UIPEthernet.h>\n";
    break;
  case _controllers.YUN:
    config += "#include <Bridge.h>\n";
    config += "#include <YunClient.h>\n";
    break;
  }

  if (!configuration.remoteIp && !configuration.remoteHost) {
    throw new Error("Either remoteIp or remoteHost must be defined");
  }

  config += "#include <EthernetClientStream.h>\n\n";

  if (this.controller !== _controllers.YUN) {
    config += "EthernetClient client;\n\n";
  } else {
    config += "YunClient client;\n\n";
  }

  if (configuration.mac && this.controller !== _controllers.YUN) {
    if (utils.validateMac(configuration.mac)) {
      // TODO - also allow dash
      config += "const byte mac[] = {0x" + configuration.mac.split(":").join(", 0x") + "};\n";
    } else {
      throw new Error("MAC address must be formatted as ff:ff:ff:ff:ff:ff");
    }
  } else {
    // make up a default mac address if non is specified
    var warning = "Using default MAC address: DE:AA:BB:CC:DD:01. If this is not unique on " +
        "your network you may experience issues. If that is the case, create a new Mac address.";
    console.warn(warning);
    config += "const byte mac[] = {0xDE, 0xAA, 0xBB, 0xCC, 0xDD, 0x01};\n";
  }

  if (configuration.remotePort) {
    config += "int remotePort = " + configuration.remotePort + ";\n";
  } else {
    throw new Error("A remotePort must be defined");
  }

  if (configuration.localIp && this.controller !== _controllers.YUN) {
    if (utils.validateIp(configuration.localIp)) {
      config += "IPAddress localIp(" + configuration.localIp.split(".").join(", ") + ");\n";
    } else {
      throw new Error("IP address must be formatted as IPv4 such as: 192.168.0.1");
    }
  }

  if (configuration.remoteIp && configuration.remoteHost) {
    console.warn("Only remoteIp or remoteHost should be specified, not both. remoteIp will be used");
  }

  // default to remoteIp if both remoteHost and remoteIp are defined
  if (configuration.remoteIp) {
    if (utils.validateIp(configuration.remoteIp)) {
      config += "IPAddress remoteIp(" + configuration.remoteIp.split(".").join(", ") + ");\n";
    } else {
      throw new Error("IP address must be formatted as IPv4 such as: 192.168.0.1");
    }
    if (configuration.localIp && this.controller !== _controllers.YUN) {
      config += "EthernetClientStream stream(client, localIp, remoteIp, NULL, remotePort);\n";
    } else {
      config += "EthernetClientStream stream(client, IPAddress(0, 0, 0, 0), remoteIp, NULL, remotePort);\n";
    }
  } else if (configuration.remoteHost) {
    config += "#define REMOTE_HOST \"" + configuration.remoteHost + "\"\n";
    if (configuration.localIp && this.controller !== _controllers.YUN) {
      config += "EthernetClientStream stream(client, localIp, IPAddress(0, 0, 0, 0), REMOTE_HOST, remotePort);\n";
    } else {
      config += "EthernetClientStream stream(client, IPAddress(0, 0, 0, 0), IPAddress(0, 0, 0, 0), REMOTE_HOST, remotePort);\n";
    }
  }

  config += "\n";
  return config;
};

/**
 * Transport code at the beginning of the Arduino loop() function.
 * Not used for Ethernet.
 */
EthernetTransport.prototype.createLoopBeginBlock = function () {
  return "";
};

/**
 * Transport code at the end of the Arduino loop() function.
 */
EthernetTransport.prototype.createLoopEndBlock = function () {
  var text = "";
  if (!this.configuration.localIp && this.controller !== _controllers.YUN) {
    text += "\n";
    text += "  if (Ethernet.maintain()) {\n";
    text += "    stream.maintain(Ethernet.localIP());\n";
    text += "  }\n";
  }
  return text;
};

/**
 * Report when the host connection state changes
 * Not yet used for Ethernet
 */
EthernetTransport.prototype.createHostConnectionCallbackFn = function () {
  return "";
};

/**
 * Create a debug function to report the transport connection status.
 * Not currently used for Ethernet
 */
EthernetTransport.prototype.createDebugStatusFn = function () {
  return "";
};

/**
 * @return {boolean} true if configuration specifies controller pins to be ignored
 */
EthernetTransport.prototype.hasIgnorePins = function () {
  return this.controller === Controllers.WIZ5100 || this.controller === Controllers.ENC28J60;
};

/**
 * Ignore pins used by the transport controller so that Firmata will not attempt to modify them.
 * Not applicable to Arduino Yun
 */
EthernetTransport.prototype.createIgnorePinsFn = function () {
  if (!this.hasIgnorePins()) {
    return "";
  }
  var fn = "";
  fn += "void ignorePins()\n";
  fn += "{\n";

  // SD-card on Ethernet shild uses pin 4 for SS
  // Ethernet shield uses pin 10 for SS
  // On Leonardo (ATmega32U4), pin 24 maps to D4 and 28 maps to D10
  fn += "  for (byte i = 0; i < TOTAL_PINS; i++) {\n";
  fn += "    if (IS_PIN_SPI(i)\n";
  fn += "        || 4 == i\n";
  fn += "        || 10 == i\n";
  fn += "#if defined(__AVR_ATmega32U4__)\n";
  fn += "        || 24 == i\n";
  fn += "        || 28 == i\n";
  fn += "#endif\n";
  fn += "      ) {\n";
  fn += "      Firmata.setPinMode(i, PIN_MODE_IGNORE);\n";
  fn += "    }\n";
  fn += "  }\n\n";

  // switch off SD-card, bypassing Firmata
  fn += "  pinMode(PIN_TO_DIGITAL(4), OUTPUT);\n";
  // SS is active low
  fn += "  digitalWrite(PIN_TO_DIGITAL(4), HIGH);\n\n";

  // configure hardware SS as output on MEGA
  fn += "#if defined(__AVR_ATmega1280__) || defined(__AVR_ATmega2560__)\n";
  fn += "  pinMode(PIN_TO_DIGITAL(53), OUTPUT);\n";
  fn += "#endif\n";

  fn += "}\n\n";
  return fn;
};

EthernetTransport.prototype.createInitTransportFn = function () {
  var fn = "";
  fn += "void initTransport()\n";
  fn += "{\n";

  if (this.controller === _controllers.YUN) {
    fn += "  Bridge.begin();\n";
  } else {
    if (this.configuration.localIp) {
      fn += "  Ethernet.begin((uint8_t *)mac, localIp);\n";
    } else {
      fn += "  Ethernet.begin((uint8_t *)mac);\n";
    }
  }
  fn += "\n";
  // TODO - determine if this delay is necessary - it may only be for ENC28J60
  // it was omitted in StandardFirmataEthernet without issue (but ENC28J60 is also not
  // supported in StandardFirmataEthernet
  //fn += "  delay(1000);\n\n";

  if (this.hasIgnorePins()) {
    fn += "  ignorePins();\n\n";
  }

  fn += "  Firmata.begin(stream);\n";
  fn += "}\n\n";
  return fn;
};

EthernetTransport.controllers = Controllers;

module.exports = EthernetTransport;
