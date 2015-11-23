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

4. Navigate to the `examples` directory and run the following command:

    ```bash
    $ node demo.js
    ```

    A file named *ConfiguredFirmata.ino* will be generated in the same directory.

5. Open ConfiguredFirmata.ino in the Arduino IDE and accept the prompt to move ConfiguredFirmata.ino into a ConfiguredFirmata sketch folder.

6. Compile and upload ConfiguredFirmata for your particular Arduino board.

Goals
===

The goal of Firmata Builder is to make it easy to create a custom Firmata sketch that provides
only the features needed for a particular application. Limiting your sketch to
only the features you need (vs the all in one StandardFirmata approach) will make
your application more efficient (since the microcontroller doesn't have to waste precious clock
cycles on unused features). Most importantly, it opens the door to offer a larger selection of features than can be offered with StandardFirmata.

Currently you can only generate sketchs that use a Serial transport. In a future version you will also
be able to generate sketches that can connect via Ethernet or Wi-Fi. If you need Ethernet before then,
you can use the [ConfigurableFirmata.ino sketch](https://github.com/firmata/ConfigurableFirmata/blob/master/examples/ConfigurableFirmata/ConfigurableFirmata.ino) included with the ConfigurableFirmata library and follow the instructions in the file to enable ethernat and configure your network settings.

Contributing
===

I'm looking for contributers, especially in figuring out how to make what is currently builder.js and features.js something that can scale well to support contributed Firmata features. If you want to get involved, [contact me](https://github.com/soundanalogous) and/or [join the gitter](https://gitter.im/firmata/firmata-builder?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge).
