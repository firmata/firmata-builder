/**
 * All Firmata features.
 * Newly added features need to be added to this file.
 *
 * Additional data will be necessary such as links to repositories
 * for Firmata device libraries as well as links to 3rd party dependencies
 */
var features = {
  "DigitalInputFirmata": {
    className: "DigitalInputFirmata",
    instanceName: "digitalInput"
  },
  "DigitalOutputFirmata": {
    className: "DigitalOutputFirmata",
    instanceName: "digitalOutput"
  },
  "AnalogInputFirmata": {
    className: "AnalogInputFirmata",
    instanceName: "analogInput",
    reporting: true
  },
  "AnalogOutputFirmata": {
    className: "AnalogOutputFirmata",
    instanceName: "analogOutput"
  },
  "ServoFirmata": {
    className: "ServoFirmata",
    instanceName: "servo",
    dependencies: [
      {
        className: "Servo"
      }
    ]
  },
  "I2CFirmata": {
    className: "I2CFirmata",
    instanceName: "i2c",
    reporting: true,
    dependencies: [
      {
        className: "Wire"
      }
    ]
  },
  "OneWireFirmata": {
    className: "OneWireFirmata",
    instanceName: "oneWire"
  },
  "StepperFirmata": {
    className: "StepperFirmata",
    instanceName: "stepper",
    update: true
  },
  "FirmataScheduler": {
    className: "FirmataScheduler",
    instanceName: "scheduler"
  },
  "FirmataEncoder": {
    className: "FirmataEncoder",
    instanceName: "encoder",
    reporting: true,
    url: "https://github.com/firmata/FirmataEncoder",
    dependencies: [
      {
        url: "https://www.pjrc.com/teensy/td_libs_Encoder.html",
        className: "Encoder"
      }
    ]
  }
};

module.exports = features;
