var _ = require("lodash");
var expect = require("chai").expect;
var WiFiTransport = require("../lib/transports/wifi.js");

describe("wifi.js", function () {

  var features = [
    "DigitalInputFirmata",
    "DigitalOutputFirmata",
    "AnalogInputFirmata",
    "AnalogOutputFirmata",
    "ServoFirmata",
    "I2CFirmata"
  ];

  var fakeDataWiFiShield101WPA = {
    filename: "TestFirmata",
    connectionType: {
      wifi: {
        controller: "WIFI_SHIELD_101",
        localIp: "192.168.0.6",
        remotePort: 3030,
        ssid: "your_network_name",
        securityType: {
          wpa: {
            passphrase: "my_wpa_passphrase"
          }
        }
      }
    },
    selectedFeatures: features
  };

  var fakeDataWiFiShieldWEP = {
    filename: "TestFirmata",
    connectionType: {
      wifi: {
        controller: "WIFI_SHIELD",
        localIp: "192.168.0.6",
        remotePort: 3030,
        ssid: "your_network_name",
        securityType: {
          wep: {
            index: 1,
            key: "my_wep_key"
          }
        }
      }
    },
    selectedFeatures: features
  };

  var fakeDataWiFiMKR1000Open = {
    filename: "TestFirmata",
    connectionType: {
      wifi: {
        controller: "MKR1000",
        //localIp: "192.168.0.6",
        remotePort: 3030,
        ssid: "your_network_name",
        securityType: {
          none: "none"
        }
      }
    },
    selectedFeatures: features
  };

  describe("constructor", function () {

    it("should throw an error if no wifi controller is specified", function () {
      var data = _.clone(fakeDataWiFiShield101WPA, true);
      data.connectionType.wifi.controller = "";
      var fn = function () {
        new WiFiTransport({configuration: data.connectionType.wifi});
      };
      expect(fn).to.throw(Error);
    });

    it("should throw an error if an invalid wifi controller is specified", function () {
      var data = _.clone(fakeDataWiFiShield101WPA, true);
      data.connectionType.wifi.controller = "INVALID_CONTROLLER";
      var fn = function () {
        new WiFiTransport({configuration: data.connectionType.wifi});
      };
      expect(fn).to.throw(Error);
    });

  });

  describe("createConfigBlock", function () {

    var data;
    var transport;

    beforeEach(function () {
      data = _.clone(fakeDataWiFiShield101WPA, true);
      transport = new WiFiTransport({configuration: data.connectionType.wifi});
    });

    it("should include the proper files for a WiFi Shield 101 controller", function () {
      var text = transport.createConfigBlock();
      expect(text).to.have.string("WiFi101Stream.h");
      expect(text).to.have.string("WiFi101Stream stream");
    });

    it("should include the proper files for a MKR1000 board", function () {
      transport = new WiFiTransport({configuration: fakeDataWiFiMKR1000Open.connectionType.wifi});
      var text = transport.createConfigBlock();
      expect(text).to.have.string("WiFi101Stream.h");
      expect(text).to.have.string("WiFi101Stream stream");
    });

    it("should include the proper files for a legacy WiFi Shield controller", function () {
      transport = new WiFiTransport({configuration: fakeDataWiFiShieldWEP.connectionType.wifi});
      var text = transport.createConfigBlock();
      expect(text).to.have.string("WiFiStream.h");
      expect(text).to.have.string("WiFiStream stream");
    });

    it("should throw an error if no remotePort is specified", function () {
      transport.configuration.remotePort = "";
      var fn = function () {
        transport.createConfigBlock();
      };
      expect(fn).to.throw(Error);
    });

    it("should define a wpa passphrase if WPA security is specified", function () {
      var text = transport.createConfigBlock();
      expect(text).to.have.string("my_wpa_passphrase");
    });

    it("should define a wep index and key if WEP security is specified", function () {
      transport = new WiFiTransport({configuration: fakeDataWiFiShieldWEP.connectionType.wifi});
      var text = transport.createConfigBlock();
      expect(text).to.have.string("wep_key[] = \"my_wep_key\"");
      expect(text).to.have.string("wep_index = 1");
    });

    it("should throw an error if a wep index is not specified", function () {
      transport = new WiFiTransport({configuration: fakeDataWiFiShieldWEP.connectionType.wifi});
      transport.configuration.securityType.wep.index = undefined;
      var fn = function () {
        var text = transport.createConfigBlock();
      };
      expect(fn).to.throw(Error);
    });

    it("should throw an error if a wep index > 3 is specified", function () {
      transport = new WiFiTransport({configuration: fakeDataWiFiShieldWEP.connectionType.wifi});
      transport.configuration.securityType.wep.index = 4;
      var fn = function () {
        var text = transport.createConfigBlock();
      };
      expect(fn).to.throw(Error);
    });

    it("should set securityType to \"NONE\" if no security is specified", function () {
      transport = new WiFiTransport({configuration: fakeDataWiFiMKR1000Open.connectionType.wifi});
      transport.securityType = {};
      var text = transport.createConfigBlock();
      expect(transport.configuration.securityType).to.equal("NONE");
    });

    it("should set securityType to \"NONE\" if security is set to \"none\"", function () {
      transport = new WiFiTransport({configuration: fakeDataWiFiMKR1000Open.connectionType.wifi});
      transport.securityType = {};
      var text = transport.createConfigBlock();
      expect(transport.configuration.securityType).to.equal("NONE");
    });

    it("should define local_ip if a localIp address is specified", function () {
      var text = transport.createConfigBlock();
      expect(text).to.have.string("local_ip(192, 168, 0, 6)");
    });

    it("should throw an error if an IP address is improperly formatted", function () {
      transport.configuration.localIp = "192,168,0,1";
      var fn = function () {
        transport.createConfigBlock();
      };
      expect(fn).to.throw(Error);
    });

  });

  describe("#createIgnorePinsFn", function () {
    var data;
    var transport;

    beforeEach(function () {
      data = _.clone(fakeDataWiFiShield101WPA, true);
      transport = new WiFiTransport({configuration: data.connectionType.wifi});
    });

    it("should use the proper pin ignore macro based on the controller type", function () {
      var text = transport.createIgnorePinsFn();
      expect(text).to.have.string("IS_IGNORE_WIFI101_SHIELD");

      transport = new WiFiTransport({configuration: fakeDataWiFiMKR1000Open.connectionType.wifi});
      text = transport.createIgnorePinsFn();
      expect(text).to.have.string("IS_IGNORE_WIFI101_SHIELD");

      transport = new WiFiTransport({configuration: fakeDataWiFiShieldWEP.connectionType.wifi});
      text = transport.createIgnorePinsFn();
      expect(text).to.have.string("IS_IGNORE_WIFI_SHIELD");
    });

    it("should include call to Firmata.setPinMode", function () {
      var text = transport.createIgnorePinsFn();
      expect(text).to.have.string("Firmata.setPinMode");
    });

    it("should set proper pin modes when using legacy WiFi Shield", function () {
      transport = new WiFiTransport({configuration: fakeDataWiFiShieldWEP.connectionType.wifi});
      var text = transport.createIgnorePinsFn();
      expect(text).to.have.string("pinMode(PIN_TO_DIGITAL(4), OUTPUT)");
      expect(text).to.have.string("pinMode(PIN_TO_DIGITAL(53), OUTPUT)");
    });
  });

  describe("#createInitTransportFn", function () {
    var data;
    var transport;

    beforeEach(function () {
      data = _.clone(fakeDataWiFiShield101WPA, true);
      transport = new WiFiTransport({configuration: data.connectionType.wifi});
    });

    it("should pass local_ip to stream.config if localIp is specified", function () {
      var text = transport.createInitTransportFn();
      expect(text).to.have.string("stream.config(local_ip)");
    });

    it("should include call to stream.begin with the appropriate parameters for WPA", function () {
      var text = transport.createInitTransportFn();
      expect(text).to.have.string("stream.begin(ssid, wpa_passphrase, SERVER_PORT)");
    });

    it("should include call to stream.begin with the appropriate parameters for WEP", function () {
      transport = new WiFiTransport({configuration: fakeDataWiFiShieldWEP.connectionType.wifi});
      var text = transport.createInitTransportFn();
      expect(text).to.have.string("stream.begin(ssid, wep_index, wep_key, SERVER_PORT)");
    });

    it("should include call to stream.begin with the appropriate parameters for open security", function () {
      transport = new WiFiTransport({configuration: fakeDataWiFiMKR1000Open.connectionType.wifi});
      var text = transport.createInitTransportFn();
      expect(text).to.have.string("stream.begin(ssid, SERVER_PORT)");
    });

    it("should include call to ignorePins() if pins should be ignored", function () {
      var text = transport.createInitTransportFn();
      expect(text).to.have.string("ignorePins();");
    });

    it("should include call to Firmata.begin(stream)", function () {
      var text = transport.createInitTransportFn();
      expect(text).to.have.string("Firmata.begin(stream);");
    });

  });

});
