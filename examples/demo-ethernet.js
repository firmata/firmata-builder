var fs = require("fs");

var builder = require("../lib/builder.js").builder;

/**
 * builder.build expects an object with this structure
 *
 * controllers:
 * "ETHERNET_SHIELD", "ETHERNET_BOARD", "WIZ5100", "ENC28J60", "YUN", "DFROBOT_XBOARD_V2",
 * "ETHERNET_SHIELD_W5100"
 */
var simulatedUserInput = {
  filename: "ConfiguredFirmataEthernet",
  connectionType: {
    ethernet: {
      controller: "ETHERNET_SHIELD",
      remoteIp: "192.168.0.1",
      //localIp: "192.168.0.6",
      //remoteHost: "server.local",
      remotePort: 3030,
      mac: "90:A2:DA:0D:07:02"
    }
  },
  selectedFeatures: [
    "DigitalInputFirmata",
    "DigitalOutputFirmata",
    "AnalogInputFirmata",
    "AnalogOutputFirmata",
    "ServoFirmata",
    "I2CFirmata",
    //"OneWireFirmata",
    //"StepperFirmata",
    //"AccelStepperFirmata",
    //"SerialFirmata",
    //"FirmataScheduler"
  ]
};

var outputText = builder.build(simulatedUserInput);

// write the Arduino skech (.ino) file
fs.writeFileSync(simulatedUserInput.filename + ".ino", outputText);
