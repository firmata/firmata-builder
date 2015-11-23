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
        className: "Encoder",
        version: "1.2"
      }
    ]
  }
};

module.exports = contributedFeatures;
