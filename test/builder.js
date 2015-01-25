var expect = require('chai').expect;
var builder = require('../lib/builder.js');

describe('builder.js', function () {

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
      "AnalogOutputFirmata"
    ]
  };

  // reset all properties
  afterEach(function () {
    builder.filename = undefined;
    builder.connectionType = undefined;
    builder.selectedFeatures = undefined;
    builder.featuresWithReporting = [];
    builder.featuresWithUpdate = [];
    builder.updateEnabled = false;
    builder.reportingEnabled = false;
    builder.systemDependencies = {};
  });

  describe('#build() - input', function () {

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

    it('should return undefined if called with no params', function () {
      expect(builder.build()).to.be.empty();
    });

    it('should return undefined if selectedFeatures is undefined', function () {
      var data = {};
      expect(builder.build(data)).to.be.empty();
    });

    it('should return undefined if no selectedFeatures are defined', function () {
      var data = {
        selectedFeatures: []
      };
      expect(builder.build(data)).to.be.empty();
    });

    it('should set default filename', function () {
      builder.build(fakeDataDefaults);
      expect(builder.filename).to.equal('ConfiguredFirmata');
    });

    it('should set default connectionType', function () {
      builder.build(fakeDataDefaults);
      expect(builder.connectionType).to.have.property('serial');
    });

    it('should set default baud', function () {
      builder.build(fakeDataDefaults);
      expect(builder.connectionType.serial.baud).to.equal(57600);
    });

  });

  describe('#processFeatureSelection()', function () {
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
      builder.featuresWithReporting = [];
      builder.featuresWithUpdate = [];
      builder.updateEnabled = false;
      builder.reportingEnabled = false;
    });

    it('should set reportingEnabled if feature in set supports it', function () {
      builder.build(dataWithReporting);
      expect(builder.reportingEnabled).to.be.true();
    });

    it('should clear reportingEnabled if no features in set support it', function () {
      builder.build(data);
      expect(builder.reportingEnabled).to.not.be.true();
    });

    it('should set updateEnabled if feature in set supports it', function () {
      builder.build(dataWithUpdate);
      expect(builder.updateEnabled).to.be.true();
    });

    it('should clear updateEnabled if no features in set support it', function () {
      builder.build(data);
      expect(builder.updateEnabled).to.not.be.true();
    });
  });

  // nothing worth testing at this time
  describe('#createHeader()', function () {

  });

  describe('#createIncludes()', function () {

    it('should include and instantiate all selected features', function () {
      builder.build(fakeData);
      var text = builder.createIncludes();

      for (var i = 0; i < fakeData.selectedFeatures.length; i++) {
        var feature = builder.allFeatures[fakeData.selectedFeatures[i]];
        expect(text).to.have.string(fakeData.selectedFeatures[i]);
        expect(text).to.have.string(feature.className + ' ' + feature.instanceName);
      }
    });

    it('should only include any system dependency once', function () {
      var features = builder.allFeatures;
      var fakeFeatures = {
        "AnalogOutputFirmata": {
          path: "utility/",
          className: "AnalogOutputFirmata",
          instanceName: "analogOutput"
        },
        "ServoFirmata": {
          path: "utility/",
          className: "ServoFirmata",
          instanceName: "servo",
          systemDependencies: [
            {
              path: "",
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

      // temporairly use fake feature list
      builder.allFeatures = fakeFeatures;
      var text = builder.createIncludes();

      var servoIncludeCount = (text.match(/<Servo.h>/g)).length;
      expect(servoIncludeCount).equals(1);

      // restore original features
      builder.allFeatures = features;
    });
  });

  describe('#createPostDependencies()', function () {

    it('should return undefined if no dependencies in feature set', function () {
      var data = {
        selectedFeatures: [
          "DigitalInputFirmata",
          "DigitalOutputFirmata"
        ]
      };
      builder.build(data);
      expect(builder.createPostDependencies()).to.be.empty();
    });

    it('should return string with includes if dependencies in feature set', function () {
      var data = {
        selectedFeatures: [
          "AnalogOutputFirmata",
          "I2CFirmata"
        ]
      };
      builder.build(data);
      var text = builder.createPostDependencies();

      expect(text).to.have.string('AnalogWrite.h');
      expect(text).to.have.string('FirmataReporting.h');
      expect(text).to.have.string('FirmataReporting reporting');
    });

  });

  describe('#createSystemResetCallbackFn()', function () {
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

    it('should not reset analog pin modes if analog input is not enabled', function () {
      builder.build(dataDigitalIn);
      var text = builder.createSystemResetCallbackFn();
      expect(text).to.not.have.string('(i, ANALOG)');
    });

    it('should not reset digital pin modes if digital output is not enabled', function () {
      builder.build(dataDigitalIn);
      var text = builder.createSystemResetCallbackFn();
      expect(text).to.not.have.string('(i, OUTPUT)');
    });

    it('should reset analog pin modes if analog input enabled', function () {
      builder.build(data);
      var text = builder.createSystemResetCallbackFn();
      expect(text).to.have.string('(i, ANALOG)');
    });

    it('should reset digital pin modes if digital output enabled', function () {
      builder.build(data);
      var text = builder.createSystemResetCallbackFn();
      expect(text).to.have.string('(i, OUTPUT)');
    });

    it('should include call to firmataExt.reset()', function () {
      builder.build(data);
      var text = builder.createSystemResetCallbackFn();
      expect(text).to.have.string('firmataExt.reset()');
    });
  });

  describe('#createSetupFn()', function () {
    builder.build(fakeData);
    var text = builder.createSetupFn();

    it('should attach ANALOG_MESSAGE if analog output or servo enabled', function () {
      expect(text).to.have.string('ANALOG_MESSAGE');
    });

    it('should add each selected feature to firmataExt', function () {
      expect(text).to.have.string('firmataExt.addFeature(digitalInput)');
      expect(text).to.have.string('firmataExt.addFeature(digitalOutput)');
      expect(text).to.have.string('firmataExt.addFeature(analogInput)');
      expect(text).to.have.string('firmataExt.addFeature(analogOutput)');
    });

    it('should add reporting feature to firmataExt if reporting is enabled', function () {
      expect(text).to.have.string('firmataExt.addFeature(reporting)');
    });

    it('should specify correct baud if connectionType is serial', function () {
      expect(text).to.have.string('begin(57600)');
    });
  });

  describe('#createLoopFn()', function () {
    var data = {
      selectedFeatures: [
        "DigitalInputFirmata",
        "DigitalOutputFirmata",
        "AnalogInputFirmata",
        "I2CFirmata",
        "StepperFirmata",
        "EncoderFirmata"
      ]
    };
    builder.build(data);
    var text = builder.createLoopFn();

    it('should call report() on each feature with reporting', function () {
      expect(text).to.have.string('analogInput.report()');
      expect(text).to.have.string('i2c.report()');
      expect(text).to.have.string('encoder.report()');
    });

    it('should call update() on each feature with updating', function () {
      expect(text).to.have.string('stepper.update()');
    });
  });

  describe('#build() - output', function () {

    afterEach(function () {
      builder.filename = undefined;
      builder.connectionType = undefined;
      builder.selectedFeatures = undefined;
    });

    it('should return a string', function () {
      expect(builder.build(fakeData)).to.be.a('string');
    });

    it('should return text of an Arduino sketch', function () {
      var text = builder.build(fakeData);
      // check for required imports and function definitions
      // preceding tests should have ensured that each method
      // produced expected outputs. The following set ensures
      // various parts of the file were assembled properly.
      expect(text).to.have.string('Firmata.h');
      expect(text).to.have.string('Servo.h');
      expect(text).to.have.string('Wire.h');
      expect(text).to.have.string('FirmataExt.h');
      expect(text).to.have.string('systemResetCallback()');
      expect(text).to.have.string('setup()');
      expect(text).to.have.string('loop()');

      expect(text).to.have.string(fakeData.selectedFeatures[0] + '.h');
    });
  });

});
