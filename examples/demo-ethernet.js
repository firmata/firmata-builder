var fs = require("fs");

var builder = require("../lib/builder.js");

// builder.build expects an object with this structure
var simulatedUserInput = {
  filename: "ConfiguredFirmataEthernet",
  connectionType: {
    ethernet: {
      controller: "Arduino Ethernet Shield", // "WIZ5100", ENC28J60", "Arduino Yun"
      remoteIp: "192.168.0.1",
      //localIp: "192.168.0.6",
      //remoteHost: "server.local"
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
    //"SerialFirmata",
    //"FirmataScheduler"
  ]
};

var outputText = builder.build(simulatedUserInput);

// write the Arduino skech (.ino) file
fs.writeFileSync(simulatedUserInput.filename + ".ino", outputText);
