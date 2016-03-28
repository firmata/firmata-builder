var utils = require("../utils.js");

var Controllers = {
  WIFI_SHIELD: "Arduino WiFi Shield",
  WIFI_SHIELD_101: "Arduino WiFi Shield 101",
  MKR1000: "Arduino MKR1000"
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
 * Creates the Wi-Fi configuration per the specified Wi-Fi options.
 * Added to top of sketch file.
 */
WiFiTransport.prototype.createConfigBlock = function () {
  var config = "";
  var configuration = this.configuration;

  config += "// uncomment to enable debugging over Serial (9600 baud)\n";
  config += "// #define SERIAL_DEBUG\n";
  config += "#include \"utility/firmataDebug.h\"\n\n";

  config += "#define WIFI_MAX_CONN_ATTEMPTS 3\n";
  config += "#define IS_IGNORE_WIFI101_SHIELD(p) ((p) == 10 || (IS_PIN_SPI(p) && (p) != SS) || (p) == 5 || (p) == 7)\n";
  config += "#define IS_IGNORE_WIFI_SHIELD(p)    ((IS_PIN_SPI(p) || (p) == 4) || (p) == 7 || (p) == 10)\n\n";

  switch (this.controller) {
  case Controllers.WIFI_SHIELD:
    config += "#include \"utility/WiFiStream.h\"\n";
    config += "WiFiStream stream;\n";
    break;
  case Controllers.WIFI_SHIELD_101:
  case Controllers.MKR1000:
    config += "#include \"utility/WiFi101Stream.h\"\n";
    config += "WiFi101Stream stream;\n";
    break;
  }
  config += "\n";

  if (configuration.remotePort) {
    config += "#define SERVER_PORT " + configuration.remotePort + "\n\n";
  } else {
    throw new Error("A remotePort must be defined");
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

  if (configuration.localIp) {
    if (utils.validateIp(configuration.localIp)) {
      config += "// comment out local_ip to use DHCP\n";
      config += "IPAddress local_ip(" + configuration.localIp.split(".").join(", ") + ");\n";
    } else {
      throw new Error("IP address must be formatted as IPv4 such as: 192.168.0.1");
    }
  }

  config += "int wifiConnectionAttemptCounter = 0;\n";
  config += "int wifiStatus = WL_IDLE_STATUS;\n\n";
  return config;
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
    params = "wpa_passphrase, ";
  } else if (this.configuration.securityType.wep) {
    type = "WEP";
    params = "wep_index, wep_key, ";
  } else {
    type = "open";
  }
  text += "  while(wifiStatus != WL_CONNECTED) {\n";
  text += "    DEBUG_PRINT(\"Attempting to connect to " + type + " SSID: \");\n";
  text += "    DEBUG_PRINTLN(ssid);\n";
  text += "    wifiStatus = stream.begin(ssid, " + params + "SERVER_PORT);\n";
  text += "    delay(5000);\n";
  text += "    if (++wifiConnectionAttemptCounter > WIFI_MAX_CONN_ATTEMPTS) break;\n";
  text += "  }\n";
  return text;
};

/**
 * Transport initialization code at the beginning of the setup() function.
 */
WiFiTransport.prototype.createInitBlock = function () {
  var text = "";
  text += "  // IMPORTANT: if SERIAL_DEBUG is enabled, program execution will stop\n";
  text += "  // at DEBUG_BEGIN until a Serial conneciton is established\n";
  text += "  DEBUG_BEGIN(9600);\n";

  var attempting = "Attempting a WiFi connection";
  if (this.controller === Controllers.WIFI_SHIELD) {
    text += "  DEBUG_PRINTLN(\"" + attempting + " using the legacy WiFi library.\");\n";
  } else if (this.controller === Controllers.WIFI_SHIELD_101 ||
             this.controller === Controllers.MKR1000) {
    text += "  DEBUG_PRINTLN(\"" + attempting + " using the WiFi 101 library.\");\n";
  }

  text += "\n";
  if (this.configuration.localIp) {
    text += "  DEBUG_PRINT(\"Using static IP: \");\n";
    text += "  DEBUG_PRINTLN(local_ip);\n";
    text += "  stream.config(local_ip);\n";
  } else {
    text += "  DEBUG_PRINTLN(\"IP will be requested from DHCP ...\");\n";
  }

  text += "\n";
  text += this.createSecurityConfigBlock();

  text += "\n";
  text += "  DEBUG_PRINTLN(\"WiFi setup done\");\n";
  text += "  printWiFiStatus();\n\n";
  return text;
};

/**
 * @return {Boolean} true if configuration specifies controller pins to be ignored
 */
WiFiTransport.prototype.hasIgnorePins = function () {
  return true;
};

/**
 * Ignore pins used by the transport controller so that Firmata will not attempt to modify them.
 */
WiFiTransport.prototype.createPinIgnoreBlock = function () {
  if (!this.hasIgnorePins()) {
    return "";
  }
  var ignore = "";
  // ConfigurableFirmataWiFi communicates with WiFi shields over SPI. Therefore all
  // SPI pins must be set to IGNORE. Otherwise Firmata would break SPI communication.
  // Additional pins may also need to be ignored depending on the particular board or
  // shield in use.
  ignore += "  // ignore pins used for WiFi controller or Firmata will overwrite their modes\n";
  ignore += "  for (byte i = 0; i < TOTAL_PINS; i++) {\n";

  switch (this.controller) {
  case Controllers.WIFI_SHIELD:
    ignore += "    if (IS_IGNORE_WIFI_SHIELD(i)\n";
    ignore += "#if defined(__AVR_ATmega32U4__)\n";
    ignore += "      || 24 == i // on Leonardo, pin 24 maps to D4 and pin 28 maps to D10\n";
    ignore += "      || 28 == i\n";
    ignore += "#endif\n";
    ignore += "    ) {\n";
    break;
  case Controllers.WIFI_SHIELD_101:
  case Controllers.MKR1000:
    ignore += "    if (IS_IGNORE_WIFI101_SHIELD(i)) {\n";
    break;
  default:
    ignore += "    if (false) {\n";
  }

  ignore += "      Firmata.setPinMode(i, PIN_MODE_IGNORE);\n";
  ignore += "    }\n";
  ignore += "  }\n";

  if (this.controller === Controllers.WIFI_SHIELD) {
    ignore += "\n";
    ignore += "  pinMode(PIN_TO_DIGITAL(4), OUTPUT); // switch off SD card bypassing Firmata\n";
    ignore += "  digitalWrite(PIN_TO_DIGITAL(4), HIGH); // SS is active low\n\n";

    ignore += "#if defined(__AVR_ATmega1280__) || defined(__AVR_ATmega2560__)\n";
    ignore += "  pinMode(PIN_TO_DIGITAL(53), OUTPUT); // configure hardware SS as output on MEGA\n";
    ignore += "#endif\n";
  }
  return ignore;
};

/**
 * Stream begin - near the end of the setup() function
 */
WiFiTransport.prototype.createBeginBlock = function () {
  return "  Firmata.begin(stream);\n";
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

/**
 * Create a debug function to report the transport connection status.
 */
WiFiTransport.prototype.createDebugStatusFn = function () {
  var fn = "";
  fn += "void printWiFiStatus() {\n";
  fn += "  if (WiFi.status() != WL_CONNECTED) {\n";
  fn += "    DEBUG_PRINT(\"WiFi connection failed. Status value: \");\n";
  fn += "    DEBUG_PRINTLN(WiFi.status());\n";
  fn += "  } else {\n";
  fn += "    DEBUG_PRINT(\"SSID: \");\n";
  fn += "    DEBUG_PRINTLN(WiFi.SSID());\n\n";

  fn += "    DEBUG_PRINT(\"IP Address: \");\n";
  fn += "    IPAddress ip = WiFi.localIP();\n";
  fn += "    DEBUG_PRINTLN(ip);\n\n";

  fn += "    DEBUG_PRINT(\"signal strength (RSSI): \");\n";
  fn += "    long rssi = WiFi.RSSI();\n";
  fn += "    DEBUG_PRINT(rssi);\n";
  fn += "    DEBUG_PRINTLN(\" dBm\");\n";
  fn += "  }\n";
  fn += "}\n\n";
  return fn;
};

WiFiTransport.controllers = Controllers;

module.exports = WiFiTransport;
