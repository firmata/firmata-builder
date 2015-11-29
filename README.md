Firmata Builder
===

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/firmata/firmata-builder?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A module to generate an Arduino sketch (.ino) file from a selection of Firmata features. It is currently used by [firmatabuilder.com](http://firmatabuilder.com). However, because it is modular it could also be wraped to create a cli utility or even used in an IDE.

To use:

1. Install [ConfigurableFirmata](https://github.com/firmata/ConfigurableFirmata)
2. Install [Node.js](http://nodejs.org)
3. Navigate to the project folder and install Node modules

    ```bash
    $ cd firmata-builder
    $ npm install
    ```

4. Navigate to the `examples` directory and run either of the following command:

    ```bash
    $ node demo.js
    ```

    ```bash
    $ node demo-ethernet.js
    ```

    The first command above will generate a file named *ConfiguredFirmata.ino* and the second will generate a file named *ConfiguredFirmataEthernet* in the same directory. These examples also demonstrate the format of the object to be passed into the `build` method.

5. Open ConfiguredFirmata.ino in the Arduino IDE and accept the prompt to move ConfiguredFirmata.ino into a ConfiguredFirmata sketch folder.

6. Compile and upload ConfiguredFirmata for your particular Arduino board.

Goals
===

Firmata Builder opens the door to offer a larger selection of features than can be offered with the all-in-one [StandardFirmata](https://github.com/firmata/arduino/blob/master/examples/StandardFirmata/StandardFirmata.ino) approach. You can include as many or as few features as your application needs (within the constraints of the board you are using). It is also possible to wrap existing Arduino libraries to use them as Firmata features. See [FirmataEncoder](https://github.com/firmata/FirmataEncoder) for an example. This makes it much easier to mix custom features with standard features (digital and analog I/O, I2C, etc).

Contributing
===

I'm looking for contributers, especially in figuring out how to make what is currently builder.js and features.js something that can scale well to support contributed Firmata features. If you want to get involved, [contact me](https://github.com/soundanalogous) and/or [join the gitter](https://gitter.im/firmata/firmata-builder?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge).
