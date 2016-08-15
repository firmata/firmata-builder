var _ = require("lodash");
var expect = require("chai").expect;
var EthernetTransport = require("../lib/transports/ethernet.js");

describe("ethernet.js", function () {

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
    selectedFeatures: [
      "DigitalInputFirmata",
      "DigitalOutputFirmata",
      "AnalogInputFirmata",
      "AnalogOutputFirmata",
      "ServoFirmata",
      "I2CFirmata"
    ]
  };

  describe("constructor", function () {

    it("should throw an error if no ethernet controller is specified", function () {
      var data = _.clone(fakeDataEthernet, true);
      data.connectionType.ethernet.controller = "";
      var fn = function () {
        new EthernetTransport({configuration: data.connectionType.ethernet});
      };
      expect(fn).to.throw(Error);
    });

    it("should throw an error if an invalid ethernet controller is specified", function () {
      var data = _.clone(fakeDataEthernet, true);
      data.connectionType.ethernet.controller = "INVALID_CONTROLLER";
      var fn = function () {
        new EthernetTransport({configuration: data.connectionType.ethernet});
      };
      expect(fn).to.throw(Error);
    });

  });

  describe("createConfigBlock", function () {

    var data;
    var transport;

    beforeEach(function () {
      data = _.clone(fakeDataEthernet, true);
      transport = new EthernetTransport({configuration: data.connectionType.ethernet});
    });

    it("should throw an error if no remoteIP or remoteHost is specified", function () {
      transport.configuration.remoteIp = "";
      var fn = function () {
        transport.createConfigBlock();
      };
      expect(fn).to.throw(Error);
    });

    it("should throw an error if no remotePort is specified", function () {
      transport.configuration.remotePort = "";
      var fn = function () {
        transport.createConfigBlock();
      };
      expect(fn).to.throw(Error);
    });

    it("should throw an error if a MAC address is improperly formatted", function () {
      transport.configuration.mac = "90-A2-DA-0D-07-02";
      var fn = function () {
        transport.createConfigBlock();
      };
      expect(fn).to.throw(Error);
    });

    it("should throw an error if an IP address is improperly formatted", function () {
      transport.configuration.remoteIp = "192,168,0,1";
      var fn = function () {
        transport.createConfigBlock();
      };
      expect(fn).to.throw(Error);
    });

    it("should declare only a remoteIp or remoteHost", function () {
      var text = transport.createConfigBlock();
      expect(text).to.have.string("IPAddress remoteIp");
      expect(text).to.not.have.string("#define REMOTE_HOST");
    });

    it("should include the proper files for a WIZ5100 controller", function () {
      var text = transport.createConfigBlock();
      expect(text).to.have.string("<SPI.h>");
      expect(text).to.have.string("<Ethernet.h>");
      expect(text).to.have.string("EthernetClient client");
    });

    it("should include the proper files for an ENC28J60 controller", function () {
      var overrideData = data.connectionType.ethernet;
      overrideData.controller = "ENC28J60";
      transport = new EthernetTransport({configuration: overrideData});
      var text = transport.createConfigBlock();
      expect(text).to.have.string("<UIPEthernet.h>");
      expect(text).to.have.string("EthernetClient client");
    });

    it("should include the proper files for an Arduino Yun controller", function () {
      var overrideData = data.connectionType.ethernet;
      overrideData.controller = "YUN";
      transport = new EthernetTransport({configuration: overrideData});
      var text = transport.createConfigBlock();
      expect(text).to.have.string("<Bridge.h>");
      expect(text).to.have.string("<YunClient.h>");
      expect(text).to.have.string("YunClient client");
    });
  });

  describe("#createIgnorePinsFn", function () {
    var data;
    var transport;

    beforeEach(function () {
      data = _.clone(fakeDataEthernet, true);
      transport = new EthernetTransport({configuration: data.connectionType.ethernet});
    });

    it("should call Firmata.setPinMode if controller is WIZ5100", function () {
      var text = transport.createIgnorePinsFn();
      expect(text).to.have.string("Firmata.setPinMode");
    });

    it("should call Firmata.setPinMode if controller is ENC28J60", function () {
      transport.controller = EthernetTransport.controllers.ENC28J60;
      var text = transport.createIgnorePinsFn();
      expect(text).to.have.string("Firmata.setPinMode");
    });

    it("should return empty string if Arduino Yun", function () {
      transport.controller = EthernetTransport.controllers.YUN;
      var text = transport.createIgnorePinsFn();
      expect(text).to.be.empty();
    });

    it("should set proper pin modes when using WIZ500", function () {
      var text = transport.createIgnorePinsFn();
      expect(text).to.have.string("pinMode(PIN_TO_DIGITAL(4), OUTPUT)");
      expect(text).to.have.string("pinMode(PIN_TO_DIGITAL(53), OUTPUT)");
    });
  });

  describe("#createInitTransportFn", function () {
    var data;
    var transport;

    beforeEach(function () {
      data = _.clone(fakeDataEthernet, true);
      transport = new EthernetTransport({configuration: data.connectionType.ethernet});
    });

    it("should call Bridge.begin if Arduino Yun", function () {
      transport.controller = EthernetTransport.controllers.YUN;
      var text = transport.createInitTransportFn();
      expect(text).to.have.string("Bridge.begin()");
    });

    it("should call Ethernet.begin with the appropriate parameters if localIp", function () {
      transport.configuration.localIp = "192.168.0.10";
      var text = transport.createInitTransportFn();
      expect(text).to.have.string("Ethernet.begin((uint8_t *)mac, localIp)");
    });

    it("should call Ethernet.begin with the appropriate parameters if NOT localIp", function () {
      var text = transport.createInitTransportFn();
      expect(text).to.have.string("Ethernet.begin((uint8_t *)mac)");
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
