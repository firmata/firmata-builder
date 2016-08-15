var utils = require("../utils.js");

var Controllers = {
  MKR1000: {
    name: "Arduino MKR1000",
    driver: "WINC1500"
  },
  ESP8266: {
    name: "ESP8266",
    driver: "ESP8266"
  },
  WIFI_SHIELD_101: {
    name: "Arduino WiFi Shield 101",
    driver: "WINC1500"
  },
  WIFI_SHIELD: {
    name: "Arduino WiFi Shield (legacy)",
    driver: "HDG204"
  }
};

/**
 * Wi-Fi transport. Currently configurable as server only on Arduino.
 * @constructor
 * @param {Objedt} opts
 */
function WiFiTransport(opts) {
  if (!(this instanceof WiFiTransport)) {
    return new WiFiTransport(opts);
  }

  this.configuration = opts.configuration;
  this.controller = Controllers[this.configuration.controller];
  if (!this.controller) {
    throw new Error("No valid Wi-Fi controller defined");
  }
}

/**
 * @private
 */
WiFiTransport.prototype.defineIgnorePins = function () {
  var text = "";
  switch (this.controller) {
    case Controllers.MKR1000:
      // no need to ignore pins for MKR1000
      break;
    case Controllers.WIFI_SHIELD_101:
      // ignore SPI pins, pin 5 (reset WiFi101 shield), pin 7 (WiFi handshake) and pin 10 (WiFi SS)
      // also don't ignore SS pin if it's not pin 10. Not needed for Arduino MKR1000.
      text += "#define IS_IGNORE_PIN(p)  ((p) == 10 || (IS_PIN_SPI(p) && (p) != SS) || (p) == 5 || (p) == 7)\n\n";
      break;
    case Controllers.WIFI_SHIELD:
      text += "#if defined(ARDUINO_WIFI_SHIELD) && defined(__AVR_ATmega32U4__)\n";
      // ignore SPI pins, pin 4 (SS for SD-Card on WiFi-shield), pin 7 (WiFi handshake)
      // and pin 10 (WiFi SS) On Leonardo, pin 24 maps to D4 and pin 28 maps to D10
      text += "#define IS_IGNORE_PIN(p)  ((IS_PIN_SPI(p) || (p) == 4) || (p) == 7 || (p) == 10 || (p) == 24 || (p) == 28)\n";
      text += "#elif defined(ARDUINO_WIFI_SHIELD)\n";
      // ignore SPI pins, pin 4 (SS for SD-Card on WiFi-shield), pin 7 (WiFi handshake)
      // and pin 10 (WiFi SS)
      text += "#define IS_IGNORE_PIN(p)  ((IS_PIN_SPI(p) || (p) == 4) || (p) == 7 || (p) == 10)\n";
      text += "#endif\n\n";
      break;
    case Controllers.ESP8266:
      text += "#if defined(ESP8266) && defined(SERIAL_DEBUG)\n";
      // ignore SPI pins, pin 4 (SS for SD-Card on WiFi-shield), pin 7 (WiFi handshake)
      // and pin 10 (WiFi SS)
      text += "#define IS_IGNORE_PIN(p)  ((p) == 1)\n";
      text += "#endif\n\n";
      break;
  }
  return text;
};

/**
 * Creates the Wi-Fi configuration per the specified Wi-Fi options.
 * Added to top of sketch file.
 */
WiFiTransport.prototype.createConfigBlock = function () {
  var config = "";
  var configuration = this.configuration;

  config += "// uncomment to enable debugging over Serial (9600 baud)\n";
  config += "//#define SERIAL_DEBUG\n";
  config += "#include \"utility/firmataDebug.h\"\n\n";

  switch (this.controller) {
  case Controllers.WIFI_SHIELD:
    config += "#include <WiFi.h>\n";
    break;
  case Controllers.WIFI_SHIELD_101:
  case Controllers.MKR1000:
    config += "#include <WiFi101.h>\n";
    break;
  case Controllers.ESP8266:
    config += "#include <ESP8266WiFi.h>\n";
    break;
  }
  config += "#include \"utility/WiFiClientStream.h\"\n";
  config += "#include \"utility/WiFiServerStream.h\"\n\n";

  config += "#define WIFI_MAX_CONN_ATTEMPTS 20\n\n";

  config += this.defineIgnorePins();

  if (configuration.remoteServerIp) {
    if (utils.validateIp(configuration.remoteServerIp)) {
      config += "// IP address of remote server\n";
      config += "#define REMOTE_SERVER_IP " + configuration.remoteServerIp.split(".").join(", ") + "\n\n";
    } else {
      throw new Error("Server IP address must be formatted as IPv4 such as: 192.168.0.1");
    }
  }

  if (configuration.networkPort) {
    config += "#define NETWORK_PORT " + configuration.networkPort + "\n\n";
  } else {
    throw new Error("A network port must be defined");
  }

  var ssid = "your_network_name";
  if (configuration.ssid) {
    ssid = configuration.ssid;
  }
  config += "char ssid[] = \"" + ssid + "\";\n";

  if (configuration.securityType.wpa) {
    var wpaPassphrase = "your_wpa_passphrase";
    if (configuration.securityType.wpa.passphrase) {
      wpaPassphrase = configuration.securityType.wpa.passphrase;
    }
    config += "char wpa_passphrase[] = \"" + wpaPassphrase + "\";\n\n";
  } else if (configuration.securityType.wep) {
    var wepIndex = configuration.securityType.wep.index;
    var wepKey = "your_wep_key";
    if (typeof wepIndex === "undefined" || wepIndex < 0 || wepIndex > 3) {
      throw new Error("Valid WEP in the range of [0-3] must be specified, even if your router/gateway numbers your keys [1-4]");
    }
    if (configuration.securityType.wep.key) {
      wepKey = configuration.securityType.wep.key;
    }
    config += "byte wep_index = " + wepIndex + ";\n";
    config += "char wep_key[] = \"" + wepKey + "\";\n\n";
  } else {
    // otherwise assume no security
    configuration.securityType = "NONE";
    config += "\n";
  }

  // static ip
  if (configuration.localIp) {
    if (utils.validateIp(configuration.localIp)) {
      config += "// comment out local_ip, subnet and gateway to use DHCP\n";
      config += "IPAddress local_ip(" + configuration.localIp.split(".").join(", ") + ");\n";
    } else {
      throw new Error("Local IP address must be formatted as IPv4 such as: 192.168.0.1");
    }

    // set default values for subnet and gateway if not specified when using ESP8266
    if (this.controller === Controllers.ESP8266 && !configuration.subnetMask) {
      configuration.subnetMask = "255.255.255.0";
    }
    if (this.controller === Controllers.ESP8266 && !configuration.gatewayIp) {
      configuration.gatewayIp = "0.0.0.0";
    }

    // set default values if only subnet or gateway is specified when not using ESP8266
    if (configuration.subnetMask && !configuration.gatewayIp) {
      configuration.gatewayIp = "0.0.0.0";
    }
    if (configuration.gatewayIp && !configuration.subnetMask) {
      configuration.subnetMask = "255.255.255.0";
    }
  }

  // required for ESP8266, optional for others
  if (configuration.localIp && configuration.subnetMask) {
    if (utils.validateIp(configuration.subnetMask)) {
      config += "IPAddress subnet(" + configuration.subnetMask.split(".").join(", ") + ");\n";
    } else {
      throw new Error("Subnet mask must be formatted as IPv4 such as: 255.255.255.0");
    }
  }
  // required for ESP8266, optional for others
  if (configuration.localIp && configuration.gatewayIp) {
    if (utils.validateIp(configuration.gatewayIp)) {
      config += "IPAddress gateway(" + configuration.gatewayIp.split(".").join(", ") + ");\n\n";
    } else {
      throw new Error("Gateway IP address must be formatted as IPv4 such as: 0.0.0.0");
    }
  }

  if (configuration.remoteServerIp) {
    // configure board as a TCP client
    config += "WiFiClientStream stream(IPAddress(REMOTE_SERVER_IP), NETWORK_PORT);\n\n";
  } else {
    // configure board as a TCP server
    config += "WiFiServerStream stream(NETWORK_PORT);\n\n";
  }

  config += "int connectionAttempts = 0;\n";
  config += "bool streamConnected = false;\n\n";
  return config;
};

/**
 * Create a debug function to report the transport connection status.
 */
WiFiTransport.prototype.createDebugStatusFn = function () {
  var fn = "";
  fn += "void printWiFiStatus()\n";
  fn += "{\n";
  fn += "  if (WiFi.status() != WL_CONNECTED) {\n";
  fn += "    DEBUG_PRINT(\"WiFi connection failed. Status value: \");\n";
  fn += "    DEBUG_PRINTLN(WiFi.status());\n";
  fn += "  } else {\n";
  if (this.configuration.remoteServerIp) {
    fn += "    DEBUG_PRINTLN(\"Board configured as a TCP client\");\n";
    fn += "    DEBUG_PRINT(\"Remote TCP server address: \");\n";
    fn += "    DEBUG_PRINTLN(\"" + this.configuration.remoteServerIp.split(".").join(", ") + "\");\n\n";
  } else {
    fn += "    DEBUG_PRINTLN(\"Board configured as a TCP server\");\n\n";
  }

  fn += "    DEBUG_PRINT(\"SSID: \");\n";
  fn += "    DEBUG_PRINTLN(WiFi.SSID());\n\n";

  fn += "    DEBUG_PRINT(\"Local IP Address: \");\n";
  fn += "    IPAddress ip = WiFi.localIP();\n";
  fn += "    DEBUG_PRINTLN(ip);\n\n";

  fn += "    DEBUG_PRINT(\"Signal strength (RSSI): \");\n";
  fn += "    long rssi = WiFi.RSSI();\n";
  fn += "    DEBUG_PRINT(rssi);\n";
  fn += "    DEBUG_PRINTLN(\" dBm\");\n";
  fn += "  }\n";
  fn += "}\n\n";
  return fn;
};

/**
 * Transport code at the beginning of the Arduino loop() function.
 * Not used for Wi-Fi.
 */
WiFiTransport.prototype.createLoopBeginBlock = function () {
  return "";
};

/**
 * Transport code at the end of the Arduino loop() function.
 */
WiFiTransport.prototype.createLoopEndBlock = function () {
  return "\n  stream.maintain();\n";
};

/*
 * Called when a TCP connection is either connected or disconnected.
 */
WiFiTransport.prototype.createHostConnectionCallbackFn = function () {
  var fn = "";
  fn += "void hostConnectionCallback(byte state)\n";
  fn += "{\n";
  fn += "  switch (state) {\n";
  fn += "    case HOST_CONNECTION_CONNECTED:\n";
  fn += "      DEBUG_PRINTLN(\"TCP connection established\");\n";
  fn += "      break;\n";
  fn += "    case HOST_CONNECTION_DISCONNECTED:\n";
  fn += "      DEBUG_PRINTLN(\"TCP connection disconnected\");\n";
  fn += "      break;\n";
  fn += "  }\n";
  fn += "}\n\n";
  return fn;
};

/**
 * @return {Boolean} true if configuration specifies controller pins to be ignored
 */
WiFiTransport.prototype.hasIgnorePins = function () {
  return this.controller !== Controllers.MKR1000;
};

/**
 * Ignore pins used by the transport controller so that Firmata will not attempt to modify them.
 */
WiFiTransport.prototype.createIgnorePinsFn = function () {
  if (!this.hasIgnorePins()) {
    return "";
  }
  var fn = "";
  fn += "void ignorePins()\n";
  fn += "{\n";

  // ConfigurableFirmataWiFi communicates with WiFi shields over SPI. Therefore all
  // SPI pins must be set to IGNORE. Otherwise Firmata would break SPI communication.
  // Additional pins may also need to be ignored depending on the particular board or
  // shield in use.
  fn += "#ifdef IS_IGNORE_PIN\n";
  fn += "  // ignore pins used for WiFi controller or Firmata will overwrite their modes\n";
  fn += "  for (byte i = 0; i < TOTAL_PINS; i++) {\n";
  fn += "    if (IS_IGNORE_PIN(i)) {\n";
  fn += "      Firmata.setPinMode(i, PIN_MODE_IGNORE);\n";
  fn += "    }\n";
  fn += "  }\n";
  fn += "#endif\n";

  if (this.controller === Controllers.WIFI_SHIELD) {
    fn += "\n";
    fn += "  pinMode(PIN_TO_DIGITAL(4), OUTPUT); // switch off SD card bypassing Firmata\n";
    fn += "  digitalWrite(PIN_TO_DIGITAL(4), HIGH); // SS is active low\n\n";

    fn += "#if defined(__AVR_ATmega1280__) || defined(__AVR_ATmega2560__)\n";
    fn += "  pinMode(PIN_TO_DIGITAL(53), OUTPUT); // configure hardware SS as output on MEGA\n";
    fn += "#endif\n";
  }

  fn += "}\n\n";
  return fn;
};

/**
 * Internal helper to create Wi-Fi security configuration block
 * @private
 */
WiFiTransport.prototype.createSecurityConfigBlock = function () {
  var type;
  var params = "";
  var text = "";
  if (this.configuration.securityType.wpa) {
    type = "WPA";
    params = ", wpa_passphrase";
  } else if (this.configuration.securityType.wep) {
    type = "WEP";
    params = ", wep_index, wep_key";
  } else {
    type = "open";
  }
  text += "  DEBUG_PRINT(\"Attempting to connect to " + type + " SSID: \");\n";
  text += "  DEBUG_PRINTLN(ssid);\n";
  text += "  stream.begin(ssid" + params + ");\n\n";

  text += "  DEBUG_PRINTLN(\"WiFi setup done.\");\n\n";

  // Wait for connection to access point to be established.
  text += "  while(WiFi.status() != WL_CONNECTED && ++connectionAttempts <= WIFI_MAX_CONN_ATTEMPTS) {\n";
  text += "    delay(500);\n";
  text += "    DEBUG_PRINT(\".\");\n";
  text += "  }\n\n";
  return text;
};

WiFiTransport.prototype.createInitTransportFn = function () {
  var fn = "";
  fn += "void initTransport()\n";
  fn += "{\n";

  fn += "  // IMPORTANT: if SERIAL_DEBUG is enabled, program execution will stop\n";
  fn += "  // at DEBUG_BEGIN until a Serial conneciton is established\n";
  fn += "  DEBUG_BEGIN(9600);\n";

  var libraryName = "";
  switch (this.controller) {
  case Controllers.WIFI_SHIELD:
    libraryName = "legacy WiFi";
    break;
  case Controllers.WIFI_SHIELD_101:
  case Controllers.MKR1000:
    libraryName = "WiFi 101";
    break;
  case Controllers.ESP8266:
    libraryName = "ESP8266 WiFi";
    break;
  }
  fn += "  DEBUG_PRINTLN(\"Attempting a WiFi connection using the " + libraryName + " library.\");\n\n";

  if (this.configuration.localIp) {
    fn += "  DEBUG_PRINT(\"Using static IP: \");\n";
    fn += "  DEBUG_PRINTLN(local_ip);\n";
    if ((this.controller === Controllers.ESP8266) || (this.configuration.subnetMask && this.configuration.gatewayIp)) {
      fn += "  stream.config(local_ip, gateway, subnet);\n\n";
    } else {
      fn += "  stream.config(local_ip);\n\n";
    }
  } else {
    fn += "  DEBUG_PRINTLN(\"IP will be requested from DHCP ...\");\n\n";
  }

  fn += "  stream.attach(hostConnectionCallback);\n\n";

  fn += this.createSecurityConfigBlock();

  fn += "  printWiFiStatus();\n\n";

  if (this.hasIgnorePins()) {
    fn += "  ignorePins();\n\n";
  }

  fn += "  Firmata.begin(stream);\n";
  fn += "}\n\n";
  return fn;
};

WiFiTransport.controllers = Controllers;

module.exports = WiFiTransport;
