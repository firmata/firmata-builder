var fs = require("fs");

var builder = require("../lib/builder.js").builder;

/**
 * builder.build expects an object with this structure
 *
 * controllers:
 * "ARDUINO_101", "BLE_NANO"
 * 
 * BLE Nano support requires patching the RedBearLab nRF51822-Arduino
 * core library. See steps 1 - 3 in this gist for instructions:
 * https://gist.github.com/soundanalogous/d39bb3eb36333a0906df
 *
 */
var simulatedUserInput = {
  filename: "ConfiguredFirmataBLE",
  connectionType: {
    ble: {
      controller: "ARDUINO_101",
      minInterval: 6, // 7.5ms / 1.25
      maxInterval: 24, // 30ms / 1.25
      localName: "FIRMATA"
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
