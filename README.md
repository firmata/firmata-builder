FirmataBuilder
===

The beginnings of a utility to generate an Arduino sketch (.ino) file from a selection of Firmata features.

At this point this project is still just a simple prototype. Lots more to do here...

To run the prototype in its current state:

1. Install the configurable version of Firmata in the Arduino IDE: https://github.com/firmata/FirmataBuilder/releases/tag/v0.0.0
2. Install [Node.js](http://nodejs.org)
3. Navigate to the project folder and install Node modules

    ```bash
    $ cd FirmataBuilder
    $ npm install
    ```
4. Run the following command:

    ```bash
    $ node builder.js
    ```

    An *output* directory will be generated.

5. Copy the contents of the *output* directory to your Arduino sketch folder, open the *ConfiguredFirmata.ino* file in the Arduino IDE, compile and upload.

Goals
===

The goal of FirmataBuilder is to make it easy to create a custom Firmata sketch that provides
only the features needed for a particular application. Limiting your sketch to
only the featurs you need (vs the all in one StandardFirmata approach) will make
your application more efficient (since the microcontroller doesn't have to waste precious clock
cycles on unused features). Most importantly, it opens the door to offer a larger selection of features.
With FirmataBuilder a user will be able to make a selection of features and an Arduino Firmata
sketch will be generated.

There are at least 3 different ways FirmataBuilder could work:

1. As a web application where the user selects features then downloads the generated .ino file.
2. As a cli utility, something like [yeoman](http://yeoman.io/)
3. As a module for use in projects such as IDEs (that may be tied to a specific Firmata client library)

Either #1 or #2 above could be the minimum viable product. I think #1 will be easier for a
wider range of users and the number of options could be tedious in the cli approach (#2). However,
considering all 3 approaches above will help in making the FirmataBuilder core more scalable.

The next steps are:
- Secure web hosting space for firmatabuilder.com (domain has been purchased)
- Server side code for generating the .ino file (builder.js is a prototype for generating the file)
- Client side code for the feature selection UI

Contributing
===

I'm looking for contributers, especially for server-side nodeJS develpment and in figuring out
how to make what is currently builder.js something that can scale well to support
contributed Firmata features. If you want to get involved, [contact me](https://github.com/soundanalogous).

Also if anyone has hosting space to donate that would be greatly appreciated.
