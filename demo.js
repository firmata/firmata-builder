var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');

var builder = require('./lib/builder.js');


// this is provided for testing
// the actual selection data will come from a web form or other means
// of input
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

var filename = simulatedUserInput.filename || "ConfiguredFirmata";
var outputText = builder.build(simulatedUserInput);

// remove the output directory if it exists (implicit)
// then create a new output directory and write the generated file in a folder
// of the same name (Arduino IDE requirement)
rimraf('output', function () {
  fs.mkdirSync('output');
  fs.mkdirSync(path.normalize('output/' + filename));
  fs.writeFileSync(path.normalize('output/' + filename + '/' + filename + '.ino'), outputText);
});
