/**
 * All Firmata features.
 * Newly added features need to be added to this file.
 *
 * Additional data will be necessary such as links to repositories
 * for Firmata device libraries as well as links to 3rd party dependencies
 */
var features = {
    "DigitalInputFirmata": {
        path: "utility/",
        className: "DigitalInputFirmata",
        instanceName: "digitalInput"
    },
    "DigitalOutputFirmata": {
        path: "utility/",
        className: "DigitalOutputFirmata",
        instanceName: "digitalOutput"
    },
    "AnalogInputFirmata": {
        path: "utility/",
        className: "AnalogInputFirmata",
        instanceName: "analogInput",
        reporting: true
    },
    "AnalogOutputFirmata": {
        path: "utility/",
        className: "AnalogOutputFirmata",
        instanceName: "analogOutput"
    },
    "ServoFirmata": {
        path: "utility/",
        className: "ServoFirmata",
        instanceName: "servo",
        systemDependencies: [
            {
                path: "",
                className: "Servo"
            }
        ]
    },
    "I2CFirmata": {
        path: "utility/",
        className: "I2CFirmata",
        instanceName: "i2c",
        reporting: true,
        systemDependencies: [
            {
                path: "",
                className: "Wire"
            }
        ]
    },
    "OneWireFirmata": {
        path: "utility/",
        className: "OneWireFirmata",
        instanceName: "oneWire"
    },
    "StepperFirmata": {
        path: "utility/",
        className: "StepperFirmata",
        instanceName: "stepper",
        update: true
    },
    "FirmataScheduler": {
        path: "utility/",
        className: "FirmataScheduler",
        instanceName: "scheduler"
    },
    "EncoderFirmata": {
        path: "utility/",
        className: "EncoderFirmata",
        instanceName: "encoder",
        reporting: true
    }
};

module.exports = features;
