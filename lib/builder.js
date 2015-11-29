/*!
 * Copyright 2015 Jeff Hoefs under the terms of the MIT license found at
 * https://github.com/firmata/firmata-builder/blob/master/LICENSE-MIT
 */

var _ = require("lodash");
var coreFeatures = require("./coreFeatures.js");
var contributedFeatures = require("./contributedFeatures");
var allFeatures = _.extend(_.clone(coreFeatures), contributedFeatures);

var analogInputEnabled;
var analogOutputEnabled;
var digitalInputEnabled;
var digitalOutputEnabled;
var servoEnabled;
var schedulerEnabled;

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
 * Additional features should not be added to this function.
 * Ideally these comparisons will be eliminated at some point.
 * @private
 */
function setEnabledFeatures(selectedFeature) {
  switch (selectedFeature) {
  case "AnalogInputFirmata":
    analogInputEnabled = true;
    break;
  case "AnalogOutputFirmata":
    analogOutputEnabled = true;
    break;
  case "DigitalInputFirmata":
    digitalInputEnabled = true;
    break;
  case "DigitalOutputFirmata":
    digitalOutputEnabled = true;
    break;
  case "ServoFirmata":
    servoEnabled = true;
    break;
  case "FirmataScheduler":
    schedulerEnabled = true;
    break;
  }
}

function clearEnabledFeatures() {
  analogInputEnabled = false;
  analogOutputEnabled = false;
  digitalInputEnabled = false;
  digitalOutputEnabled = false;
  servoEnabled = false;
  schedulerEnabled = false;
}

/**
 * @module builder
 * Given a set of Firmata features and options, generates text for an Arduino
 * .ino file.
 */
var builder = {

  allFeatures: allFeatures,

  controllers: Controllers,

  /**
   * Refer to the demo.js and demo-ethernet.js files in /firmata-builder/examples/
   * to properly format the object that is passed to the builder.build method.
   * @param {Object} options User selected features and options
   * @return {String} The text for the .ino file
   */
  build: function(options) {
    var outputText = "";

    if (typeof options === "undefined") {
      throw new Error("No options passed to build method");
    }

    if (typeof options.selectedFeatures === "undefined" || options.selectedFeatures.length < 1) {
      throw new Error("Must specify at least one selected feature");
    }

    this.featuresWithReporting = [];
    this.featuresWithUpdate = [];
    this.dependencies = Object.create(null);
    this.updateEnabled = false;
    this.reportingEnabled = false;

    this.ethernetController = "";

    this.filename = options.filename || "ConfiguredFirmata";
    this.connectionType = options.connectionType || {serial: {baud: 57600}};
    this.selectedFeatures = options.selectedFeatures;

    this.processFeatureSelection();

    outputText += this.createHeader();
    outputText += this.createIncludes();
    outputText += this.createPostDependencies();
    outputText += this.createSystemResetCallbackFn();
    outputText += this.createSetupFn();
    outputText += this.createLoopFn();

    return outputText;
  },

  /**
   * Determine which features use reporting and which are updated on each iteration
   * of the main loop.
   * @private
   */
  processFeatureSelection: function() {
    var len = this.selectedFeatures.length;

    clearEnabledFeatures();
    for (var i = 0; i < len; i++) {
      setEnabledFeatures(this.selectedFeatures[i]);
      var feature = this.allFeatures[this.selectedFeatures[i]];

      if (feature.reporting) {
        this.featuresWithReporting.push(feature);
      }
      if (feature.update) {
        this.featuresWithUpdate.push(feature);
      }
    }

    if (this.featuresWithReporting.length > 0) {
      this.reportingEnabled = true;
    }

    if (this.featuresWithUpdate.length > 0) {
      this.updateEnabled = true;
    }
  },

  /**
   * @private
   */
  validateIp: function(ip) {
    if (/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * @private
   */
  validateMac: function(mac) {
    // from: http://stackoverflow.com/questions/4260467/what-is-a-regular-expression-for-a-mac-address
    if (/^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/.test(mac)) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * Not applicable to Arduino Yun
   * @private
   */
  configureIgnorePins: function () {
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
  },

  /**
   * Creates the ethernet configuration per the specified etherent options.
   * @private
   */
  createEthernetConfig: function() {
    var config = "";
    var ethernet = this.connectionType.ethernet;

    switch (Controllers[ethernet.controller]) {
    case Controllers.WIZ5100:
      this.ethernetController = Controllers.WIZ5100;
      config += "#include <SPI.h>\n";
      config += "#include <Ethernet.h>\n";
      break;
    case Controllers.ENC28J60:
      this.ethernetController = Controllers.ENC28J60;
      config += "#include <UIPEthernet.h>\n";
      break;
    case Controllers["Arduino Yun"]:
      this.ethernetController = Controllers.YUN;
      config += "#include <Bridge.h>\n";
      config += "#include <YunClient.h>\n";
      break;
    default:
      throw new Error("No valid ethernet controller defined");
    }

    if (!ethernet.remoteIp && !ethernet.remoteHost) {
      throw new Error("Either remoteIp or remoteHost must be defined");
    }

    config += "#include <EthernetClientStream.h>\n\n";

    if (this.ethernetController !== Controllers.YUN) {
      config += "EthernetClient client;\n\n";
    } else {
      config += "YunClient client;\n\n";
    }

    if (ethernet.mac && this.ethernetController !== Controllers.YUN) {
      if (this.validateMac(ethernet.mac)) {
        // TODO - also allow dash
        config += "const byte mac[] = {0x" + ethernet.mac.split(":").join(", 0x") + "};\n";
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

    if (ethernet.remotePort) {
      config += "int remotePort = " + ethernet.remotePort + ";\n";
    } else {
      throw new Error("A remotePort must be defined");
    }

    if (ethernet.localIp && this.ethernetController !== Controllers.YUN) {
      if (this.validateIp(ethernet.localIp)) {
        config += "IPAddress localIp(" + ethernet.localIp.split(".").join(", ") + ");\n";
      } else {
        throw new Error("IP address must be formatted as IPv4 such as: 192.168.0.1");
      }
    }

    if (ethernet.remoteIp && ethernet.remoteHost) {
      console.warn("Only remoteIp or remoteHost should be specified, not both. remoteIp will be used");
    }

    // default to remoteIp if both remoteHost and remoteIp are defined
    if (ethernet.remoteIp) {
      if (this.validateIp(ethernet.remoteIp)) {
        config += "IPAddress remoteIp(" + ethernet.remoteIp.split(".").join(", ") + ");\n";
      } else {
        throw new Error("IP address must be formatted as IPv4 such as: 192.168.0.1");
      }
      if (ethernet.localIp && this.ethernetController !== Controllers.YUN) {
        config += "EthernetClientStream stream(client, localIp, remoteIp, NULL, remotePort);\n";
      } else {
        config += "EthernetClientStream stream(client, IPAddress(0, 0, 0, 0), remoteIp, NULL, remotePort);\n";
      }
    } else if (ethernet.remoteHost) {
      config += "#define REMOTE_HOST \"" + ethernet.remoteHost + "\"\n";
      if (ethernet.localIp && this.ethernetController !== Controllers.YUN) {
        config += "EthernetClientStream stream(client, localIp, IPAddress(0, 0, 0, 0), REMOTE_HOST, remotePort);\n";
      } else {
        config += "EthernetClientStream stream(client, IPAddress(0, 0, 0, 0), IPAddress(0, 0, 0, 0), REMOTE_HOST, remotePort);\n";
      }
    }

    config += "\n";

    return config;
  },

  /**
   * @private
   */
  createHeader: function() {
    var date = new Date();
    var header = "/*\n * " + this.filename + ".ino generated by FirmataBuilder\n";
    header += " * " + date.toString() + "\n */\n\n";
    return header;
  },

  /**
   * Creates the block of includes, macros and global variables at the top of the file.
   * @private
   */
  createIncludes: function() {
    var includes = "#include <ConfigurableFirmata.h>\n\n";

    if (this.connectionType.ethernet) {
      includes += this.createEthernetConfig();
    }

    for (var i = 0, len = this.selectedFeatures.length; i < len; i++) {
      var feature = this.allFeatures[this.selectedFeatures[i]];

      if (feature.dependencies) {
        for (var j = 0; j < feature.dependencies.length; j++) {
          var d = feature.dependencies[j];
          // prevent duplicate includes
          if (!this.dependencies[d.className]) {
            includes += "#include <" + d.className + ".h>\n";
            this.dependencies[d.className] = true;
          }
        }
      }

      includes += "#include <" + feature.className + ".h>\n";
      includes += feature.className + " " + feature.instanceName + ";\n\n";
    }

    // necessary until Servo can be decoupled from analog output
    if (servoEnabled && !analogOutputEnabled) {
      includes += "#include <AnalogOutputFirmata.h>\n";
      includes += "AnalogOutputFirmata analogOutput;\n\n";
    }

    // always include FirmataExt
    includes += "#include <FirmataExt.h>\n";
    includes += "FirmataExt firmataExt;\n\n";

    return includes;
  },

  /**
   * Dependencies that should be included after the initial set of included files.
   * @private
   */
  createPostDependencies: function() {
    var includes = "";
    if (analogOutputEnabled || servoEnabled) {
      includes += "#include <AnalogWrite.h>\n\n";
    }
    if (this.reportingEnabled) {
      includes += "#include <FirmataReporting.h>\n";
      includes += "FirmataReporting reporting;\n\n";
    }
    return includes;
  },

  /**
   * @private
   */
  createSystemResetCallbackFn: function() {
    var fn = "void systemResetCallback()\n";
    fn += "{\n";
    fn += "  for (byte i = 0; i < TOTAL_PINS; i++) {\n";
    fn += "    if (IS_PIN_ANALOG(i)) {\n";

    if (analogInputEnabled) {
      fn += "      Firmata.setPinMode(i, ANALOG);\n";
    }

    fn += "    } else if (IS_PIN_DIGITAL(i)) {\n";

    if (digitalOutputEnabled) {
      fn += "      Firmata.setPinMode(i, OUTPUT);\n";
    }

    fn += "    }\n";
    fn += "  }\n";

    fn += "  firmataExt.reset();\n";

    fn += "}\n\n";
    return fn;
  },

  /**
   * Creates the Arduino setup() function
   * @private
   */
  createSetupFn: function() {
    var fn = "void setup()\n";
    fn += "{\n";

    if (this.connectionType.ethernet) {
      if (this.ethernetController === Controllers.YUN) {
        fn += "  Bridge.begin();\n";
      } else {
        if (this.connectionType.ethernet.localIP) {
          fn += "  Ethernet.begin((uint8_t *)mac, localIp);\n";
        } else {
          fn += "  Ethernet.begin((uint8_t *)mac);\n";
        }
      }
      // TODO - determine if this delay is necessary - it may only be for ENC28J60
      // it was omitted in StandardFirmataEthernet without issue (but ENC28J60 is also not
      // supported in StandardFirmataEthernet
      //fn += "  delay(1000);\n\n";
    }

    fn += "  Firmata.setFirmwareVersion(FIRMWARE_MAJOR_VERSION, FIRMWARE_MINOR_VERSION);\n\n";

    for (var i = 0, len = this.selectedFeatures.length; i < len; i++) {
      var feature = this.allFeatures[this.selectedFeatures[i]];
      fn += "  firmataExt.addFeature(" + feature.instanceName + ");\n";
    }

    // necessary until Servo can be decoupled from analog output
    if (servoEnabled && !analogOutputEnabled) {
      fn += "  firmataExt.addFeature(analogOutput);\n\n";
    }

    if (this.reportingEnabled) {
      fn += "  firmataExt.addFeature(reporting);\n\n";
    }

    fn += "  Firmata.attach(SYSTEM_RESET, systemResetCallback);\n\n";

    if (this.connectionType.serial) {
      fn += "  Firmata.begin(" + this.connectionType.serial.baud + ");\n\n";
    } else if (this.connectionType.ethernet) {
      if (this.ethernetController !== Controllers.YUN) {
        fn += this.configureIgnorePins();
        fn += "\n";
      }
      fn += "  Firmata.begin(stream);\n\n";
    }

    fn += "  systemResetCallback();\n";

    fn += "}\n\n";
    return fn;
  },

  /**
   * Creates the Arduino loop() function.
   * @private
   */
  createLoopFn: function() {
    var fn = "void loop()\n";
    fn += "{\n";

    if (digitalInputEnabled) {
      fn += "  digitalInput.report();\n\n";
    }

    fn += "  while(Firmata.available()) {\n";
    fn += "    Firmata.processInput();\n";

    if (schedulerEnabled) {
      fn += "    if (!Firmata.isParsingMessage()) {\n";
      fn += "      goto runtasks;\n";
      fn += "    }\n";
      fn += "  }\n"; // end while (if scheduler)
      fn += "  if (!Firmata.isParsingMessage()) {\n";
      fn += "runtasks: scheduler.runTasks();\n";
    }

    // if scheduler end if, else end while
    fn += "  }\n\n";

    if (this.reportingEnabled) {
      var numReporting = this.featuresWithReporting.length;
      fn += "  if (reporting.elapsed()) {\n";
      for (var i = 0; i < numReporting; i++) {
        fn += ("    " + this.featuresWithReporting[i].instanceName + ".report();\n");
      }
      fn += "  }\n";
    }

    if (this.updateEnabled) {
      var numUpdate = this.featuresWithUpdate.length;
      fn += "\n";
      for (var k = 0; k < numUpdate; k++) {
        fn += ("  " + this.featuresWithUpdate[k].instanceName + ".update();\n");
      }
    }

    if (this.connectionType.ethernet) {
      if (!this.connectionType.ethernet.localIp && this.ethernetController !== Controllers.YUN) {
        fn += "\n";
        fn += "  if (Ethernet.maintain()) {\n";
        fn += "    stream.maintain(Ethernet.localIP());\n";
        fn += "  }\n";
      }
    }

    fn += "}\n";
    return fn;
  }

};

//module.exports = builder;

module.exports = {
  builder: builder,
  coreFeatures: coreFeatures,
  contributedFeatures: contributedFeatures
};
