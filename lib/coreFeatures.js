/**
 * Core Firmata features.
 *
 * Core features are included in the ConfigurableFirmata library. They provide support for
 * board-level features such as digital and analog I/O and I2C as well as support for core
 * Arduino libraries such as Servo.
 *
 * OneWire and Stepper are included for legacy purposes but ideally should be contributed features
 * rather than core features in that they wrap libraries not included in the Arduino distro.
 */
var coreFeatures = {
  "DigitalInputFirmata": {
    className: "DigitalInputFirmata",
    instanceName: "digitalInput",
    description: "Read digital input pins"
  },
  "DigitalOutputFirmata": {
    className: "DigitalOutputFirmata",
    instanceName: "digitalOutput",
    description: "Write to digital output pins"
  },
  "AnalogInputFirmata": {
    className: "AnalogInputFirmata",
    instanceName: "analogInput",
    description: "Read analog input pins",
    reporting: true
  },
  "AnalogOutputFirmata": {
    className: "AnalogOutputFirmata",
    instanceName: "analogOutput",
    description: "Write to analog output (PWM) pins"
  },
  "ServoFirmata": {
    className: "ServoFirmata",
    instanceName: "servo",
    description: "Control servo motors",
    dependencies: [
      {
        className: "Servo"
      }
    ]
  },
  "I2CFirmata": {
    className: "I2CFirmata",
    instanceName: "i2c",
    description: "Interface with I2C devices",
    reporting: true,
    dependencies: [
      {
        className: "Wire"
      }
    ]
  },
  "OneWireFirmata": {
    className: "OneWireFirmata",
    instanceName: "oneWire",
    description: "Interface with OneWire devices"
  },
  "StepperFirmata": {
    className: "StepperFirmata",
    instanceName: "stepper",
    description: "Control stepper motor drivers (2 and 4 wire H-bridge and step + direction style drivers such as EasyDriver)",
    update: true
  },
  "FirmataScheduler": {
    className: "FirmataScheduler",
    instanceName: "scheduler",
    description: "A task scheduler for Firmata"
  }
};

module.exports = coreFeatures;
