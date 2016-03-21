var utils = require("../utils.js");

var Controllers = {
  WIZ5100: "WIZ5100",
  ENC28J60: "ENC28J60",
  "Arduino Yun": "Arduino Yun"
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
    this.controller = Controllers.YUN;
    break;
  default:
    throw new Error("No valid ethernet controller defined");
  }
}

EthernetTransport.prototype.createBeginBlock = function () {
  return "  Firmata.begin(stream);\n\n";
};

EthernetTransport.prototype.createInitBlock = function () {
  var text = "";
  if (this.controller === Controllers.YUN) {
    text += "  Bridge.begin();\n";
  } else {
    if (this.configuration.localIP) {
      text += "  Ethernet.begin((uint8_t *)mac, localIp);\n";
    } else {
      text += "  Ethernet.begin((uint8_t *)mac);\n";
    }
  }
  text += "\n";
  // TODO - determine if this delay is necessary - it may only be for ENC28J60
  // it was omitted in StandardFirmataEthernet without issue (but ENC28J60 is also not
  // supported in StandardFirmataEthernet
  //text += "  delay(1000);\n\n";
  return text;
};

/**
 * @return {boolean} true if pins to ignore are specified
 */
EthernetTransport.prototype.hasIgnorePins = function () {
  return this.controller === Controllers.WIZ5100 || this.controller === Controllers.ENC28J60;
};

/**
 * Not applicable to Arduino Yun
 */
EthernetTransport.prototype.createPinIgnoreBlock = function () {
  var ignore = "";
  // SD-card on Ethernet shild uses pin 4 for SS
  // Ethernet shield uses pin 10 for SS
  // On Leonardo (ATmega32U4), pin 24 maps to D4 and 28 maps to D10
  ignore += "  for (byte i = 0; i < TOTAL_PINS; i++) {\n";
  ignore += "    if (IS_PIN_SPI(i)\n";
  ignore += "        || 4 == i\n";
  ignore += "        || 10 == i\n";
  ignore += "#if defined(__AVR_ATmega32U4__)\n";
  ignore += "        || 24 == i\n";
  ignore += "        || 28 == i\n";
  ignore += "#endif\n";
  ignore += "      ) {\n";
  ignore += "      Firmata.setPinMode(i, PIN_MODE_IGNORE);\n";
  ignore += "    }\n";
  ignore += "  }\n\n";

  // switch off SD-card, bypassing Firmata
  ignore += "  pinMode(PIN_TO_DIGITAL(4), OUTPUT);\n";
  // SS is active low
  ignore += "  digitalWrite(PIN_TO_DIGITAL(4), HIGH);\n\n";

  // configure hardware SS as output on MEGA
  ignore += "#if defined(__AVR_ATmega1280__) || defined(__AVR_ATmega2560__)\n";
  ignore += "  pinMode(PIN_TO_DIGITAL(53), OUTPUT);\n";
  ignore += "#endif\n";

  return ignore;
};

/**
 * Creates the ethernet configuration per the specified etherent options.
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
  case Controllers.YUN:
    config += "#include <Bridge.h>\n";
    config += "#include <YunClient.h>\n";
    break;
  }

  if (!configuration.remoteIp && !configuration.remoteHost) {
    throw new Error("Either remoteIp or remoteHost must be defined");
  }

  config += "#include <EthernetClientStream.h>\n\n";

  if (this.controller !== Controllers.YUN) {
    config += "EthernetClient client;\n\n";
  } else {
    config += "YunClient client;\n\n";
  }

  if (configuration.mac && this.controller !== Controllers.YUN) {
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

  if (configuration.localIp && this.controller !== Controllers.YUN) {
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
    if (configuration.localIp && this.controller !== Controllers.YUN) {
      config += "EthernetClientStream stream(client, localIp, remoteIp, NULL, remotePort);\n";
    } else {
      config += "EthernetClientStream stream(client, IPAddress(0, 0, 0, 0), remoteIp, NULL, remotePort);\n";
    }
  } else if (configuration.remoteHost) {
    config += "#define REMOTE_HOST \"" + configuration.remoteHost + "\"\n";
    if (configuration.localIp && this.controller !== Controllers.YUN) {
      config += "EthernetClientStream stream(client, localIp, IPAddress(0, 0, 0, 0), REMOTE_HOST, remotePort);\n";
    } else {
      config += "EthernetClientStream stream(client, IPAddress(0, 0, 0, 0), IPAddress(0, 0, 0, 0), REMOTE_HOST, remotePort);\n";
    }
  }

  config += "\n";
  return config;
};

/**
 * Code added to the beginning of the Arduino loop() function
 */
EthernetTransport.prototype.createLoopBeginBlock = function () {
  return "";
};

/**
 * Code added to the end of the Arduino loop() function
 */
EthernetTransport.prototype.createLoopEndBlock = function () {
  var text = "";
  if (!this.configuration.localIp && this.controller !== Controllers.YUN) {
    text += "\n";
    text += "  if (Ethernet.maintain()) {\n";
    text += "    stream.maintain(Ethernet.localIP());\n";
    text += "  }\n";
  }
  return text;
};

EthernetTransport.prototype.createDebugStatusFn = function () {
  return "";
};

module.exports = EthernetTransport;
