var _ = require("lodash");
var expect = require("chai").expect;
var utils = require("../lib/utils.js");

describe("utils.js", function () {

  describe("#validateIp", function () {

    it("should return true if an IP address is properly formatted", function () {
      // currently this is the only valid format
      var result = utils.validateIp("192.168.0.1");
      expect(result).to.be.true();
    });

    it("should return false if an IP address is improperly formatted", function () {
      var result1 = utils.validateIp("192,168,0,1");
      expect(result1).to.not.be.true();

      var result2 = utils.validateIp("192.168.0");
      expect(result2).to.not.be.true();
    });

  });

  describe("#validateMac", function () {

    it("should return true if a MAC address is properly formatted", function () {
      // currently this is the only valid format
      var result = utils.validateMac("90:A2:DA:0D:07:02");
      expect(result).to.be.true();
    });

    it("should return false if a MAC address is improperly formatted", function () {
      var result1 = utils.validateMac("90-A2-DA-0D-07-02");
      expect(result1).to.not.be.true();

      var result2 = utils.validateMac("90:A2:DA:0D:07");
      expect(result2).to.not.be.true();
    });

  });

});
