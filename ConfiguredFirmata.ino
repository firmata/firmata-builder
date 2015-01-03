#include <Firmata.h>

#include <utility/DigitalInputFirmata.h>
DigitalInputFirmata digitalInput;

#include <utility/DigitalOutputFirmata.h>
DigitalOutputFirmata digitalOutput;

#include <utility/AnalogInputFirmata.h>
AnalogInputFirmata analogInput;

#include <utility/AnalogOutputFirmata.h>
AnalogOutputFirmata analogOutput;

#include <Servo.h>
#include <utility/ServoFirmata.h>
ServoFirmata servo;

#include <Wire.h>
#include <utility/I2CFirmata.h>
I2CFirmata i2c;

#include <utility/OneWireFirmata.h>
OneWireFirmata oneWire;

#include <utility/StepperFirmata.h>
StepperFirmata stepper;

#include <utility/FirmataScheduler.h>
FirmataScheduler scheduler;

#include <utility/EncoderFirmata.h>
EncoderFirmata encoder;

#include <utility/FirmataExt.h>
FirmataExt firmataExt;

#include <utility/AnalogWrite.h>

#include <utility/FirmataReporting.h>
FirmataReporting reporting;

void systemResetCallback()
{
  for (byte i = 0; i < TOTAL_PINS; i++) {
    if (IS_PIN_ANALOG(i)) {
      Firmata.setPinMode(i, ANALOG);
    } else if (IS_PIN_DIGITAL(i)) {
      Firmata.setPinMode(i, OUTPUT);
    }
  }
  firmataExt.reset();
}

void setup()
{
  Firmata.setFirmwareVersion(FIRMATA_MAJOR_VERSION, FIRMATA_MINOR_VERSION);

  Firmata.attach(ANALOG_MESSAGE, analogWriteCallback);

  firmataExt.addFeature(digitalInput);
  firmataExt.addFeature(digitalOutput);
  firmataExt.addFeature(analogInput);
  firmataExt.addFeature(analogOutput);
  firmataExt.addFeature(servo);
  firmataExt.addFeature(i2c);
  firmataExt.addFeature(oneWire);
  firmataExt.addFeature(stepper);
  firmataExt.addFeature(scheduler);
  firmataExt.addFeature(encoder);
  firmataExt.addFeature(reporting);

  Firmata.attach(SYSTEM_RESET, systemResetCallback);

  Firmata.begin(57600);

  systemResetCallback();
}

void loop()
{
  digitalInput.report();

  while(Firmata.available()) {
    Firmata.processInput();
    if (!Firmata.isParsingMessage()) {
      goto runtasks;
    }
  }
  if (!Firmata.isParsingMessage()) {
runtasks: scheduler.runTasks();
  }

  if (reporting.elapsed()) {
    analogInput.report();
    i2c.report();
    encoder.report();
  }

  stepper.update();
}
