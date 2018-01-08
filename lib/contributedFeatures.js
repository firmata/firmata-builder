/**
 * Contributed Firmata features.
 *
 * Contributed features are typically wrappers of existing 3rd party libraries and are hosted
 * outside of the main ConfigurableFirmata repository.
 */
var contributedFeatures = {
  "FirmataEncoder": {
    className: "FirmataEncoder",
    instanceName: "encoder",
    reporting: true,
    version: "0.1.0",
    description: "Adds support for rotary encoders and other position sensors.",
    url: "https://github.com/firmata/FirmataEncoder",
    dependencies: [
      {
        url: "https://www.pjrc.com/teensy/td_libs_Encoder.html",
        name: "Encoder",
        className: "Encoder",
        version: "1.2",
        note: ""
      }
    ]
  },
  "RCOutputFirmata": {
    className: "RCOutputFirmata",
    instanceName: "rcOutput",
    reporting: false,
    version: "2.0.0",
    description: "An adapter for the rc-switch Arduino library. Include RCOutputFirmata to transmit RF signals.",
    url: "https://github.com/git-developer/RCSwitchFirmata",
    dependencies: [
      {
        url: "https://github.com/sui77/rc-switch/releases/tag/v2.52",
        name: "rc-switch",
        className: "",
        skipInclude: true,
        version: "2.52",
        note: "When rc-switch 2.6.0 or newer is used, it is not possible to send tristate codes. However, sending long codes is possible."
      }
    ]
  },
  "RCInputFirmata": {
    className: "RCInputFirmata",
    instanceName: "rcInput",
    reporting: true,
    version: "2.0.0",
    description: "An adapter for the rc-switch Arduino library. Include RCInputFirmata to receive RF signals.",
    url: "https://github.com/git-developer/RCSwitchFirmata",
    dependencies: [
      {
        url: "https://github.com/sui77/rc-switch/releases/tag/v2.52",
        name: "rc-switch",
        className: "",
        version: "2.52",
        note: ""
      }
    ]
  }
};

module.exports = contributedFeatures;
