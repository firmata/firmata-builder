var fs = require('fs');

var postDependencies = [];
var text = "";
var reportingEnabled = false;

var allFeatures = {
    "DigitalInputFirmata": {
        path: "utility/",
        className: "DigitalInputFirmata",
        instance: "digitalInput"
    },
    "DigitalOutputFirmata": {
        path: "utility/",
        className: "DigitalOutputFirmata",
        instance: "digitalOutput"
    },
    "AnalogInputFirmata": {
        path: "utility/",
        className: "AnalogInputFirmata",
        instance: "analogInput",
    },
    "AnalogOutputFirmata": {
        path: "utility/",
        className: "AnalogOutputFirmata",
        instance: "analogOutput"
    },
    "ServoFirmata": {
        path: "utility/",
        className: "ServoFirmata",
        instance: "servo",
        dependencies: [
            {
                path: "",
                className: "Servo"
            }
        ]
    },
    "I2CFirmata": {
        path: "utility/",
        className: "I2CFirmata",
        instance: "i2c",
        dependencies: [
            {
                path: "",
                className: "Wire"
            }
        ]
    },
    "OneWireFirmata": {
        path: "utility/",
        className: "OneWireFirmata",
        instance: "oneWire"
    },
    "StepperFirmata": {
        path: "utility/",
        className: "StepperFirmata",
        instance: "stepper"
    },
    "FirmataExt": {
        path: "utility/",
        className: "FirmataExt",
        instance: "firmataExt"
    },
    "FirmataScheduler": {
        path: "utility/",
        className: "FirmataScheduler",
        instance: "scheduler"
    }
}

var featureList = [
    "DigitalInputFirmata",
    "DigitalOutputFirmata",
    "AnalogInputFirmata",
    "AnalogOutputFirmata",
    "ServoFirmata",
    "I2CFirmata",
    "OneWireFirmata",
    "StepperFirmata",
    "FirmataExt",
    "FirmataScheduler"
];

function addHeader() {
    text += "#include <Firmata.h>";
    text += "\n\n";
}

function addIncludes() {
    var includes = "";
    for (var i = 0, len = featureList.length; i < len; i++) {
        var feature = allFeatures[featureList[i]];

        if (feature.dependencies) {
            for (var j = 0; j < feature.dependencies.length; j++) {
                d = feature.dependencies[j];
                includes += "#include <" + d.path + d.className + ".h>\n";
            }
        }

        includes += "#include <" + feature.path + feature.className + ".h>\n";
        includes += feature.className + " " + feature.instance + ";";
        includes += "\n\n";
    };

    text += includes;
}

function addPostDependencies() {
    var includes = "";
    if (featureList.indexOf("AnalogOutputFirmata") > -1 || featureList.indexOf("ServoFirmata") > -1) {
        includes += "#include <utility/AnalogWrite.h>";
        includes += "\n\n";
    }
    if (featureList.indexOf("AnalogInputFirmata") > -1 || featureList.indexOf("I2CFirmata") > -1) {
        includes += "#include <utility/FirmataReporting.h>\n";
        includes += "FirmataReporting reporting;";
        includes += "\n\n";
        reportingEnabled = true;
    }

    text += includes;
}

function addSystemResetCallbackFn() {
    var fn = "void systemResetCallback()\n";
    fn += "{\n";
    fn += "  for (byte i = 0; i < TOTAL_PINS; i++) {\n";
    fn += "    if (IS_PIN_ANALOG(i)) {\n";

    if (featureList.indexOf("AnalogInputFirmata") > -1) {
        fn += "      Firmata.setPinMode(i, ANALOG);\n";
    }

    fn += "    } else if (IS_PIN_DIGITAL(i)) {\n";

    if (featureList.indexOf("DigitalOutputFirmata") > -1) {
        fn += "      Firmata.setPinMode(i, OUTPUT);\n";
    }

    fn += "    }\n";
    fn += "  }\n";

    if (featureList.indexOf("FirmataExt") > -1) {
        fn += "  firmataExt.reset();\n";
    }

    fn += "}\n\n";
    text += fn;
}

function addSetupFn() {
    var fn = "void setup()\n";
    fn += "{\n";

    fn += "  Firmata.setFirmwareVersion(FIRMATA_MAJOR_VERSION, FIRMATA_MINOR_VERSION);\n\n";

    if (featureList.indexOf("AnalogOutputFirmata") > -1 || featureList.indexOf("ServoFirmata") > -1) {
        fn += "  Firmata.attach(ANALOG_MESSAGE, analogWriteCallback);\n\n";
    }

    if (featureList.indexOf("FirmataExt") > -1) {
        for (var i = 0, len = featureList.length; i < len; i++) {
            var feature = allFeatures[featureList[i]];
            if (feature.className !== "FirmataExt") {
                fn += "  firmataExt.addFeature(" + feature.instance + ");\n";
            }
        }        
    }

    if (reportingEnabled) {
        fn += "  firmataExt.addFeature(reporting);\n\n";
    }

    fn += "  Firmata.attach(SYSTEM_RESET, systemResetCallback);\n\n";

    fn += "  Firmata.begin(57600);\n\n";

    fn += "  systemResetCallback();\n";

    fn += "}\n\n";
    text += fn;
}

function addLoopFn() {
    var fn = "void loop()\n";
    fn += "{\n";

    if (featureList.indexOf("DigitalInputFirmata") > -1) {
        fn += "  digitalInput.report();\n\n";
    }

    fn += "  while(Firmata.available()) {\n";
    fn += "    Firmata.processInput();\n";

    if (featureList.indexOf("FirmataScheduler") > -1) {
        fn += "    if (!Firmata.isParsingMessage()) {\n";
        fn += "      goto runtasks;\n";
        fn += "    }\n";
        fn += "  }\n"; // end while (if scheduler)
        fn += "  if (!Firmata.isParsingMessage()) {\n";
        fn += "runtasks: scheduler.runTasks();\n";
    }

    // if scheduler end if, else end while
    fn += "  }\n\n";

    if (reportingEnabled) {
        fn += "  if (reporting.elapsed()) {\n";

        if (featureList.indexOf("AnalogInputFirmata") > -1) {
            fn += "    analogInput.report();\n";
        }
        if (featureList.indexOf("I2CFirmata") > -1) {
            fn += "    i2c.report();\n";
        }

        fn += "  }\n\n";
    }

    if (featureList.indexOf("StepperFirmata") > -1) {
        fn += "  stepper.update();\n";
    }

    fn += "}\n";
    text += fn;
}


addHeader();
addIncludes();
addPostDependencies();
addSystemResetCallbackFn();
addSetupFn();
addLoopFn();

fs.writeFileSync('TestFirmata.ino', text);
