var _ = require("lodash");
var expect = require("chai").expect;
var sinon = require("sinon");
var builder = require("../lib/builder.js").builder;
// including following transports only to check instance
var SerialTransport = require("../lib/transports/serial.js");
var EthernetTransport = require("../lib/transports/ethernet.js");
var WiFiTransport = require("../lib/transports/wifi.js");
var BLETransport = require("../lib/transports/ble.js");

describe("builder.js", function () {

  var featureList = [
    "DigitalInputFirmata",
    "DigitalOutputFirmata",
    "AnalogInputFirmata",
    "AnalogOutputFirmata",
    "ServoFirmata",
    "I2CFirmata"
  ];

  var fakeData = {
    filename: "TestFirmata",
    connectionType: {
      serial: {
        baud: 57600
      }
    },
    selectedFeatures: featureList
  };

  var fakeDataEthernet = {
    filename: "TestFirmata",
    connectionType: {
      ethernet: {
        controller: "WIZ5100",
        remoteIp: "192.168.0.1",
        remotePort: 3030,
        remoteHost: "",
        localIp: "",
        mac: "90:A2:DA:0D:07:02"
      }
    },
    selectedFeatures: featureList
  };

  var fakeDataWiFi = {
    filename: "TestFirmata",
    connectionType: {
      wifi: {
        controller: "WIFI_SHIELD_101",
        localIp: "192.168.0.6",
        networkPort: 3030,
        ssid: "your_network_name",
        securityType: {
          wpa: {
            passphrase: "your_wpa_passphrase"
          }
        }
      }
    },
    selectedFeatures: featureList
  };

  var fakeDataBLE = {
    filename: "TestFirmata",
    connectionType: {
      ble: {
        controller: "ARDUINO_101",
        minInterval: 6, // 7.5ms / 1.25
        maxInterval: 24, // 30 ms / 1.25
        localName: "FIRMATA"
      }
    },
    selectedFeatures: featureList
  };

  // reset all properties
  afterEach(function () {
    builder.filename = undefined;
    builder.connectionType = undefined;
    builder.selectedFeatures = undefined;
  });

  describe("#build() - input", function () {

    var fakeDataDefaults = {
      selectedFeatures: [
        "DigitalInputFirmata"
      ]
    };

    afterEach(function () {
      builder.filename = undefined;
      builder.connectionType = undefined;
      builder.selectedFeatures = undefined;
    });

    it("should throw an error if no options parameter is passed", function () {
      var fn = function () {
        builder.build();
      };
      expect(fn).to.throw(Error);
    });

    it("should throw an error if no selected features are defined", function () {
      var fn = function () {
        var opts = {
          filename: "test",
          connectionType: {serial: {baud: 57600}},
          selectedFeatures: []
        };
        builder.build(opts);
      };
      expect(fn).to.throw(Error);
    });

    it("should set default filename", function () {
      builder.build(fakeDataDefaults);
      expect(builder.filename).to.equal("ConfiguredFirmata");
    });

    it("should set default connectionType", function () {
      builder.build(fakeDataDefaults);
      expect(builder.connectionType).to.have.property("serial");
    });

    it("should set default baud", function () {
      builder.build(fakeDataDefaults);
      expect(builder.connectionType.serial.baud).to.equal(57600);
    });

    it("should create a Serial transport", function () {
      builder.build(fakeDataDefaults);
      expect(builder.transport).to.be.instanceof(SerialTransport);
    });

    it("should create an Ethernet transport", function () {
      builder.build(fakeDataEthernet);
      expect(builder.transport).to.be.instanceof(EthernetTransport);
    });

    it("should create a Wi-Fi transport", function () {
      builder.build(fakeDataWiFi);
      expect(builder.transport).to.be.instanceof(WiFiTransport);
    });

    it("should create a BLE transport", function () {
      builder.build(fakeDataBLE);
      expect(builder.transport).to.be.instanceof(BLETransport);
    });

  });

  describe("#processFeatureSelection()", function () {
    var data = {
      selectedFeatures: [
        "DigitalInputFirmata",
        "DigitalOutputFirmata"
      ]
    };

    var dataWithReporting = {
      selectedFeatures: [
        "DigitalInputFirmata",
        "DigitalOutputFirmata",
        "I2CFirmata"
      ]
    };

    var dataWithUpdate = {
      selectedFeatures: [
        "DigitalInputFirmata",
        "DigitalOutputFirmata",
        "StepperFirmata"
      ]
    };

    afterEach(function () {
      builder.selectedFeatures = undefined;
    });

    it("should set reportingEnabled if feature in set supports it", function () {
      builder.build(dataWithReporting);
      expect(builder.reportingEnabled).to.be.true();
    });

    it("should clear reportingEnabled if no features in set support it", function () {
      builder.build(data);
      expect(builder.reportingEnabled).to.not.be.true();
    });

    it("should set updateEnabled if feature in set supports it", function () {
      builder.build(dataWithUpdate);
      expect(builder.updateEnabled).to.be.true();
    });

    it("should clear updateEnabled if no features in set support it", function () {
      builder.build(data);
      expect(builder.updateEnabled).to.not.be.true();
    });
  });

  // nothing worth testing at this time
  describe("#createHeader()", function () {

  });

  describe("#createIncludes()", function () {

    it("should include and instantiate all selected features", function () {
      builder.build(fakeData);
      var text = builder.createIncludes();

      for (var i = 0; i < fakeData.selectedFeatures.length; i++) {
        var feature = builder.allFeatures[fakeData.selectedFeatures[i]];
        expect(text).to.have.string(fakeData.selectedFeatures[i]);
        expect(text).to.have.string(feature.className + " " + feature.instanceName);
      }
    });

    it("should only include any system dependency once", function () {
      var features = builder.allFeatures;
      var fakeFeatures = {
        "AnalogOutputFirmata": {
          className: "AnalogOutputFirmata",
          instanceName: "analogOutput"
        },
        "ServoFirmata": {
          className: "ServoFirmata",
          instanceName: "servo",
          dependencies: [
            {
              className: "Servo"
            }
          ]
        },
      };
      var data = {
        selectedFeatures: [
          "AnalogOutputFirmata",
          "ServoFirmata"
        ]
      };
      builder.build(data);

      // clear dependencies that were added in call to build
      builder.dependencies = {};
      // temporairly use fake feature list
      builder.allFeatures = fakeFeatures;
      var text = builder.createIncludes();

      var servoIncludeCount = (text.match(/<Servo.h>/g)).length;
      expect(servoIncludeCount).equals(1);

      // restore original features
      builder.allFeatures = features;
    });

    // ensure transport.createConfigBlock was called
    it("should call transport.createConfigBlock", function () {
      builder.build(fakeDataEthernet);
      var spy = sinon.spy(builder.transport, "createConfigBlock");
      builder.createIncludes();
      expect(spy.calledOnce).to.equal(true);
    });
  });

  describe("#createPostDependencies()", function () {

    it("should return undefined if no dependencies in feature set", function () {
      var data = {
        selectedFeatures: [
          "DigitalInputFirmata",
          "DigitalOutputFirmata"
        ]
      };
      builder.build(data);
      expect(builder.createPostDependencies()).to.be.empty();
    });

    it("should return string with includes if dependencies in feature set", function () {
      var data = {
        selectedFeatures: [
          "AnalogOutputFirmata",
          "I2CFirmata"
        ]
      };
      builder.build(data);
      var text = builder.createPostDependencies();

      expect(text).to.have.string("AnalogWrite.h");
      expect(text).to.have.string("FirmataReporting.h");
      expect(text).to.have.string("FirmataReporting reporting");
    });

  });

  describe("#createSystemResetCallbackFn()", function () {
    var data = {
      selectedFeatures: [
        "AnalogInputFirmata",
        "DigitalOutputFirmata"
      ]
    };

    var dataDigitalIn = {
      selectedFeatures: [
        "DigitalInputFirmata"
      ]
    };

    it("should not reset analog pin modes if analog input is not enabled", function () {
      builder.build(dataDigitalIn);
      var text = builder.createSystemResetCallbackFn();
      expect(text).to.not.have.string("(i, ANALOG)");
    });

    it("should not reset digital pin modes if digital output is not enabled", function () {
      builder.build(dataDigitalIn);
      var text = builder.createSystemResetCallbackFn();
      expect(text).to.not.have.string("(i, OUTPUT)");
    });

    it("should reset analog pin modes if analog input enabled", function () {
      builder.build(data);
      var text = builder.createSystemResetCallbackFn();
      expect(text).to.have.string("(i, ANALOG)");
    });

    it("should reset digital pin modes if digital output enabled", function () {
      builder.build(data);
      var text = builder.createSystemResetCallbackFn();
      expect(text).to.have.string("(i, OUTPUT)");
    });

    it("should include call to firmataExt.reset()", function () {
      builder.build(data);
      var text = builder.createSystemResetCallbackFn();
      expect(text).to.have.string("firmataExt.reset()");
    });
  });

  describe("#createInitFirmataFn()", function () {
    builder.build(fakeData);
    var text = builder.createInitFirmataFn();

    it("should add each selected feature to firmataExt", function () {
      expect(text).to.have.string("firmataExt.addFeature(digitalInput)");
      expect(text).to.have.string("firmataExt.addFeature(digitalOutput)");
      expect(text).to.have.string("firmataExt.addFeature(analogInput)");
      expect(text).to.have.string("firmataExt.addFeature(analogOutput)");
    });

    it("should add reporting feature to firmataExt if reporting is enabled", function () {
      expect(text).to.have.string("firmataExt.addFeature(reporting)");
    });

  });

  describe("#createSetupFn()", function () {
    builder.build(fakeData);
    var text = builder.createSetupFn();

    it("should include call to initFirmata()", function () {
      expect(text).to.have.string("initFirmata();");
    });

    it("should include call to initTransport()", function () {
      expect(text).to.have.string("initTransport();");
    });

    it("should include call to Firmata.parse(SYSTEM_RESET)", function () {
      expect(text).to.have.string("Firmata.parse(SYSTEM_RESET);");
    });
  });

  describe("#createLoopFn()", function () {
    var data = _.clone(fakeDataWiFi, true);
    data.selectedFeatures = [
      "DigitalInputFirmata",
      "DigitalOutputFirmata",
      "AnalogInputFirmata",
      "I2CFirmata",
      "StepperFirmata"
    ];
    builder.build(data);
    var spy = sinon.spy(builder.transport, "createLoopEndBlock");
    var text = builder.createLoopFn();

    it("should include call to report() on each feature with reporting", function () {
      expect(text).to.have.string("analogInput.report()");
      expect(text).to.have.string("i2c.report()");
    });

    it("should include call to update() on each feature with updating", function () {
      expect(text).to.have.string("stepper.update()");
    });

    it("should include call to transport.createLoopEndBlock", function () {
      expect(spy.calledOnce).to.equal(true);
      expect(text).to.have.string("stream.maintain");
    });
  });

  describe("#build() - output", function () {

    afterEach(function () {
      builder.filename = undefined;
      builder.connectionType = undefined;
      builder.selectedFeatures = undefined;
    });

    it("should return a string", function () {
      expect(builder.build(fakeData)).to.be.a("string");
    });

    it("should return text of an Arduino sketch", function () {
      var text = builder.build(fakeData);
      // check for required imports and function definitions
      // preceding tests should have ensured that each method
      // produced expected outputs. The following set ensures
      // various parts of the file were assembled properly.
      expect(text).to.have.string("ConfigurableFirmata.h");
      expect(text).to.have.string("Servo.h");
      expect(text).to.have.string("Wire.h");
      expect(text).to.have.string("FirmataExt.h");
      expect(text).to.have.string("systemResetCallback()");
      expect(text).to.have.string("initTransport()");
      expect(text).to.have.string("initFirmata()");
      expect(text).to.have.string("setup()");
      expect(text).to.have.string("loop()");

      expect(text).to.have.string(fakeData.selectedFeatures[0] + ".h");
    });

    it("should include call to Firmata.begin() with the baud rate if Serial transport", function () {
      var text = builder.build(fakeData);
      expect(text).to.have.string("Firmata.begin(57600)");
    });

    it("should include call to ignorePins() if Wi-Fi and pins should be ignored", function () {
      var text = builder.build(fakeDataWiFi);
      expect(text).to.have.string("ignorePins()");
    });

    it("should include call to ignorePins() if Ethernet and pins should be ignored", function () {
      var text = builder.build(fakeDataEthernet);
      expect(text).to.have.string("ignorePins()");
    });

    it("should include call to stream.poll() if BLE transport", function () {
      var text = builder.build(fakeDataBLE);
      expect(text).to.have.string("if (!stream.poll()) return");
    });

  });

});
