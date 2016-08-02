/*!
 * Copyright 2015-2016 Jeff Hoefs under the terms of the MIT license found at
 * https://github.com/firmata/firmata-builder/blob/master/LICENSE-MIT
 */

var _ = require("lodash");
var utils = require("./utils.js");
var WiFiTransport = require("./transports/wifi.js");
var EthernetTransport = require("./transports/ethernet.js");
var SerialTransport = require("./transports/serial.js");
var coreFeatures = require("./coreFeatures.js");
var contributedFeatures = require("./contributedFeatures");
var allFeatures = _.extend(_.clone(coreFeatures), contributedFeatures);

var analogInputEnabled;
var analogOutputEnabled;
var digitalInputEnabled;
var digitalOutputEnabled;
var servoEnabled;
var schedulerEnabled;

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
 * .ino (sketch) file.
 */
var builder = {

  allFeatures: allFeatures,

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

    this.filename = options.filename || "ConfiguredFirmata";
    this.connectionType = options.connectionType || {serial: {baud: 57600}};
    this.selectedFeatures = options.selectedFeatures;

    this.transport = this.createTransport(this.connectionType);

    this.processFeatureSelection();

    outputText += this.createHeader();
    outputText += this.createIncludes();
    outputText += this.createPostDependencies();
    outputText += this.createSystemResetCallbackFn();
    outputText += this.transport.createHostConnectionCallbackFn();
    outputText += this.transport.createDebugStatusFn();
    outputText += this.transport.createIgnorePinsFn();
    outputText += this.transport.createInitTransportFn();
    outputText += this.createInitFirmataFn();
    outputText += this.createSetupFn();
    outputText += this.createLoopFn();

    return outputText;
  },

  /**
   * Create a transport object for the specified connection type.
   * Throws an error if no valid connection type was specified.
   * @param {Object} config The connection type object
   * @return {Object}
   */
  createTransport: function(config) {
    var transport;
    if (config.wifi) {
      transport = new WiFiTransport({
        configuration: config.wifi
      });
    } else if (config.ethernet) {
      transport = new EthernetTransport({
        configuration: config.ethernet
      });
    } else if (config.serial) {
      transport = new SerialTransport({
        configuration: config.serial
      });
    } else {
      throw new Error("Must specify a valid connection type");
    }
    return transport;
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

    includes += this.transport.createConfigBlock();

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
   * @private
   */
  createInitFirmataFn: function() {
    var fn = "void initFirmata()\n";
    fn += "{\n";

    fn += "  Firmata.setFirmwareVersion(FIRMATA_FIRMWARE_MAJOR_VERSION, FIRMATA_FIRMWARE_MINOR_VERSION);\n\n";

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

    fn += "  Firmata.attach(SYSTEM_RESET, systemResetCallback);\n";

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

    fn += "  initFirmata();\n\n";

    fn += "  initTransport();\n\n";

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

    fn += this.transport.createLoopBeginBlock();

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

    fn += this.transport.createLoopEndBlock();

    fn += "}\n";
    return fn;
  }

};

module.exports = {
  builder: builder,
  coreFeatures: coreFeatures,
  contributedFeatures: contributedFeatures
};
