var fs = require('fs');

var builder = require('../lib/builder.js');

// builder.build expects and object with this structure
var simulatedUserInput = {
  filename: "ConfiguredFirmata",
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
    "I2CFirmata",
    "OneWireFirmata",
    "StepperFirmata",
    "FirmataScheduler",
    "EncoderFirmata"
  ]
};

var outputText = builder.build(simulatedUserInput);

// write the Arduino skech (.ino) file
fs.writeFileSync(simulatedUserInput.filename + '.ino', outputText);
