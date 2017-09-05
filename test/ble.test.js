var _ = require("lodash");
var expect = require("chai").expect;
var BLETransport = require("../lib/transports/ble.js");

describe("ble.js", function () {

  var features = [
    "DigitalInputFirmata",
    "DigitalOutputFirmata",
    "AnalogInputFirmata",
    "AnalogOutputFirmata",
    "ServoFirmata",
    "I2CFirmata"
  ];

  var fakeDataArduino101 = {
    filename: "TestFirmata",
    connectionType: {
      ble: {
        controller: "ARDUINO_101",
        minInterval: 6, // 7.5ms / 1.25
        maxInterval: 24, // 30 ms / 1.25
        localName: "FIRMATA"
      }
    },
    selectedFeatures: features
  };

  var fakeDataBleNano = {
    filename: "TestFirmata",
    connectionType: {
      ble: {
        controller: "BLE_NANO",
        minInterval: 6, // 7.5ms / 1.25
        maxInterval: 24, // 30 ms / 1.25
        localName: "FIRMATA"
      }
    },
    selectedFeatures: features
  };

  describe("constructor", function () {
    
    it("should throw an error if no BLE controller is specified", function () {
      var data = _.clone(fakeDataArduino101, true);
      data.connectionType.ble.controller = "";
      var fn = function () {
        new WiFiTransport({configuration: data.connectionType.ble});
      };
      expect(fn).to.throw(Error);
    });

    it("should throw an error if an invalid BLE controller is specified", function () {
      var data = _.clone(fakeDataArduino101, true);
      data.connectionType.ble.controller = "INVALID_CONTROLLER";
      var fn = function () {
        new WiFiTransport({configuration: data.connectionType.ble});
      };
      expect(fn).to.throw(Error);
    });

  });

  describe("createConfigBlock", function () {
    var data;
    var transport;

    beforeEach(function () {
      data = _.clone(fakeDataArduino101, true);
      transport = new BLETransport({configuration: data.connectionType.ble});
    });

    it("should include the proper files for an Arduino 101", function () {
      var text = transport.createConfigBlock();
      expect(text).to.have.string("CurieBLE.h");
      expect(text).to.have.string("BLEStream.h");
    });

    it("should include the proper files for a BLE Nano", function () {
      transport = new BLETransport({configuration: fakeDataBleNano.connectionType.ble});
      var text = transport.createConfigBlock();
      expect(text).to.have.string("BLEPeripheral.h");
      expect(text).to.have.string("BLEStream.h");
    });

    it("should limit the min interval to 6", function () {
      transport.configuration.minInterval = 1;
      var text = transport.createConfigBlock();
      expect(text).to.have.string("FIRMATA_BLE_MIN_INTERVAL 6");
    });

    it("should ensure min and max interval are integers", function () {
      transport.configuration.minInterval = 8.75;
      transport.configuration.maxInterval = 25.3;
      var text = transport.createConfigBlock();
      expect(text).to.have.string("FIRMATA_BLE_MIN_INTERVAL 8");
      expect(text).to.have.string("FIRMATA_BLE_MAX_INTERVAL 25");
    });

    it("should set 'FIRMATA' as the default localName value", function () {
      transport.configuration.localName = "";
      var text = transport.createConfigBlock();
      expect(text).to.have.string("FIRMATA_BLE_LOCAL_NAME \"FIRMATA\"");
    });

    it("should all the user to specify a localName", function () {
      transport.configuration.localName = "MY_LOCAL_NAME";
      var text = transport.createConfigBlock();
      expect(text).to.have.string("FIRMATA_BLE_LOCAL_NAME \"MY_LOCAL_NAME\"");
    });

    it("should create a BLEStream instance", function () {
      var text = transport.createConfigBlock();
      expect(text).to.have.string("BLEStream stream");
    });

  });

});
