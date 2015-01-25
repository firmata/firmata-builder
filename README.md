Firmata Builder
===

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/firmata/firmata-builder?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

The beginnings of a module to generate an Arduino sketch (.ino) file from a selection of Firmata features.

At this point this project is still just a simple prototype. Lots more to do here...

To run the prototype in its current state:

1. Install the [configurable version of Firmata](https://github.com/firmata/arduino/tree/configurable) in the Arduino IDE: https://github.com/firmata/firmata-builder/releases/tag/v0.0.0
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

    An file named *ConfiguredFirmata.ino* will be generated in the same directory.

5. Move ConfiguredFirmata.ino to your Arduino sketch folder, open ConfiguredFirmata.ino in the Arduino IDE and accept the prompt to move ConfiguredFirmata.ino into a ConfiguredFirmata sketch folder.

6. Compile and upload ConfiguredFirmata for your particular Arduino board.

Goals
===

The goal of Firmata Builder is to make it easy to create a custom Firmata sketch that provides
only the features needed for a particular application. Limiting your sketch to
only the featurs you need (vs the all in one StandardFirmata approach) will make
your application more efficient (since the microcontroller doesn't have to waste precious clock
cycles on unused features). Most importantly, it opens the door to offer a larger selection of features.
With Firmata Builder a user will be able to make a selection of features and an Arduino Firmata
sketch will be generated.

There are at least 3 different ways Firmata Builder could work:

1. As a web application where the user selects features then downloads the generated .ino file.
2. As a cli utility, something like [yeoman](http://yeoman.io/)
3. As a module for use in projects such as IDEs (that may be tied to a specific Firmata client library)

Either #1 or #2 above could be the minimum viable product. I think #1 will be easier for a
wider range of users and the number of options could be tedious in the cli approach (#2). However,
considering all 3 approaches above will help in making the Firmata Builder core more scalable.

The next steps are:
- Determine scalable approach for managing feature data (currently lib/features.js)
- Secure web hosting space for firmatabuilder.com (domain has been purchased)
- Develop firmatabuilder.com

This repository is for the development of the firmata-builder module. A separate repo is likely
necessary for the web application (firmatabuilder.com).

Contributing
===

I'm looking for contributers, especially for server-side nodeJS develpment and in figuring out
how to make what is currently builder.js and features.js something that can scale well to support
contributed Firmata features. If you want to get involved, [contact me](https://github.com/soundanalogous) and/or [join the gitter](https://gitter.im/firmata/firmata-builder?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge).

Also if anyone has hosting space to donate that would be greatly appreciated.
