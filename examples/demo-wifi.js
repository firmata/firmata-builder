var fs = require("fs");

var builder = require("../lib/builder.js").builder;

/**
 * builder.build expects an object with this structure
 *
 * controllers:
 * "MKR1000", "ESP8266", "WIFI_SHIELD_101", WIFI_SHIELD"
 */
var simulatedUserInput = {
  filename: "ConfiguredFirmataWiFi",
  connectionType: {
    wifi: {
      controller: "MKR1000",
      //localIp: "192.168.0.6",
      //subnetMask: "255.255.255.0",
      //gatewayIp: "0.0.0.0",
      //remoteServerIp: "192.168.0.1",
      networkPort: 3030,
      ssid: "your_network_name",
      securityType: {
        wpa: {
          passphrase: "your_wpa_passphrase"
        },
        // wep: {
        //   index: 0,
        //   key: "your_wep_key"
        // },
        // none: "none"
      }
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
