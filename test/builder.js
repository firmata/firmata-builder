var _ = require("lodash");
var expect = require("chai").expect;
var builder = require("../lib/builder.js");

describe("builder.js", function () {

  var fakeData = {
    filename: "TestFirmata",
    connectionType: {
      serial: {
        baud: 57600
      }
    },
    selectedFeatures: [
      "DigitalInputFirmata",
      "DigitalOutputFirmata",
      "AnalogInputFirmata",
      "AnalogOutputFirmata",
      "ServoFirmata",
      "I2CFirmata"
    ]
  };

  var fakeDataEthernet = {
    filename: "TextFirmata",
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
    selectedFeatures: [
      "DigitalInputFirmata",
      "DigitalOutputFirmata",
      "AnalogInputFirmata",
      "AnalogOutputFirmata",
      "ServoFirmata",
      "I2CFirmata"
    ]
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

  });

  describe("#createEthernetConfig()", function () {

    it("should throw an error if no ethernet controller is specified", function () {
      var data = _.clone(fakeDataEthernet, true);
      data.connectionType.ethernet.controller = "";
      var fn = function () {
        builder.build(data);
      };
      expect(fn).to.throw(Error);
    });

    it("should throw an error if no remoteIP or remoteHost is specified", function () {
      var data = _.clone(fakeDataEthernet, true);
      data.connectionType.ethernet.remoteIp = "";
      var fn = function () {
        builder.build(data);
      };
      expect(fn).to.throw(Error);
    });

    it("should throw an error if no remotePort is specified", function () {
      var data = _.clone(fakeDataEthernet, true);
      data.connectionType.ethernet.remotePort = "";
      var fn = function () {
        builder.build(data);
      };
      expect(fn).to.throw(Error);
    });

    it("should throw an error if a MAC address is improperly formatted", function () {
      var data = _.clone(fakeDataEthernet, true);
      // TODO - this should be more flexible since dashes should be made to pass
      data.connectionType.ethernet.mac = "90-A2-DA-0D-07-02";
      var fn = function () {
        builder.build(data);
      };
      expect(fn).to.throw(Error);
    });

    it("should throw an error if an IP address is improperly formatted", function () {
      var data = _.clone(fakeDataEthernet, true);
      data.connectionType.ethernet.remoteIp = "192,168,0,1";
      var fn = function () {
        builder.build(data);
      };
      expect(fn).to.throw(Error);
    });

    it("should declare only a remoteIp or remoteHost", function () {
      builder.build(fakeDataEthernet);
      var text = builder.createEthernetConfig();
      expect(text).to.have.string("IPAddress remoteIp");
      expect(text).to.not.have.string("#define REMOTE_HOST");
    });

    it("should include the proper files for a WIZ5100 controller", function () {
      builder.build(fakeDataEthernet);
      var text = builder.createEthernetConfig();
      expect(text).to.have.string("<SPI.h>");
      expect(text).to.have.string("<Ethernet.h>");
      expect(text).to.have.string("EthernetClient client");
    });

    it("should include the proper files for an ENC28J60 controller", function () {
      var data = _.clone(fakeDataEthernet, true);
      data.connectionType.ethernet.controller = "ENC28J60";
      builder.build(data);
      var text = builder.createEthernetConfig();
      expect(text).to.have.string("<UIPEthernet.h>");
      expect(text).to.have.string("EthernetClient client");
    });

    it("should include the proper files for an Arduino Yun controller", function () {
      var data = _.clone(fakeDataEthernet, true);
      data.connectionType.ethernet.controller = "Arduino Yun";
      builder.build(data);
      var text = builder.createEthernetConfig();
      expect(text).to.have.string("<Bridge.h>");
      expect(text).to.have.string("<YunClient.h>");
      expect(text).to.have.string("YunClient client");
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

    it("should include the ethernet config if ethernet", function () {
      builder.build(fakeDataEthernet);
      var text = builder.createIncludes();
      expect(text).to.have.string("<Ethernet.h>");
      expect(text).to.have.string("<EthernetClientStream.h>");
      expect(text).to.have.string("EthernetClient client");
      expect(text).to.have.string("EthernetClientStream stream");
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

  describe("#createSetupFn()", function () {
    builder.build(fakeData);
    var text = builder.createSetupFn();

    it("should add each selected feature to firmataExt", function () {
      expect(text).to.have.string("firmataExt.addFeature(digitalInput)");
      expect(text).to.have.string("firmataExt.addFeature(digitalOutput)");
      expect(text).to.have.string("firmataExt.addFeature(analogInput)");
      expect(text).to.have.string("firmataExt.addFeature(analogOutput)");
    });

    it("should add reporting feature to firmataExt if reporting is enabled", function () {
      expect(text).to.have.string("firmataExt.addFeature(reporting)");
    });

    it("should specify correct baud if connectionType is serial", function () {
      expect(text).to.have.string("begin(57600)");
    });
  });

  describe("#createSetupFn() - serial", function () {
    builder.build(fakeData);
    var text = builder.createSetupFn();

    it("should specify correct baud if connectionType is serial", function () {
      expect(text).to.have.string("begin(57600)");
    });
  });

  describe("#createSetupFn() - ethernet", function () {
    builder.build(fakeDataEthernet);
    var text = builder.createSetupFn();

    it("should call build on correct object if connectionType is ethernet", function () {
      expect(text).to.have.string("Ethernet.begin");
    });

    it("should pass the ethernet stream to Firmata.begin", function () {
      expect(text).to.have.string("Firmata.begin(stream)");
    });

    it("should define pins to be ignored", function () {
      expect(text).to.have.string("Firmata.setPinMode(i, PIN_MODE_IGNORE)");
    });
  });

  describe("#createLoopFn()", function () {
    var data = {
      selectedFeatures: [
        "DigitalInputFirmata",
        "DigitalOutputFirmata",
        "AnalogInputFirmata",
        "I2CFirmata",
        "StepperFirmata"
      ]
    };
    builder.build(data);
    var text = builder.createLoopFn();

    it("should call report() on each feature with reporting", function () {
      expect(text).to.have.string("analogInput.report()");
      expect(text).to.have.string("i2c.report()");
    });

    it("should call update() on each feature with updating", function () {
      expect(text).to.have.string("stepper.update()");
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
      expect(text).to.have.string("setup()");
      expect(text).to.have.string("loop()");

      expect(text).to.have.string(fakeData.selectedFeatures[0] + ".h");
    });

    it("should manage maintaining the ethernet connection", function () {
      var text = builder.build(fakeDataEthernet);
      expect(text).to.have.string("stream.maintain");
    });
  });

});
