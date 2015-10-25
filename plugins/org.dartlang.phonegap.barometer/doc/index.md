// Copyright (c) 2014, the Dart project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

# org.dartlang.phonegap.barometer

This plugin provides access to the device's barometer.

## Installation

    cordova plugin add https://github.com/zanderso/cordova-plugin-barometer.git

## Supported Platforms

- Android

## Methods

- navigator.barometer.getCurrentPressure
- navigator.barometer.watchPressure
- navigator.barometer.clearWatch

## Objects

- Pressure

## navigator.barometer.getCurrentPressure

Get the current atmospheric pressure.

The pressure values are returned to the `barometerSuccess`
callback function.

    navigator.barometer.getCurrentPressure(barometerSuccess, barometerError);


### Example

    function onSuccess(pressure) {
        alert('Pressure: '  + pressure.val + '\n' +
              'Timestamp: ' + pressure.timestamp + '\n');
    };

    function onError() {
        alert('onError!');
    };

    navigator.barometer.getCurrentPressure(onSuccess, onError);

## navigator.barometer.watchPressure

Retrieves the device's current `Pressure` at a regular interval, executing
the `barometerSuccess` callback function each time. Specify the interval in
milliseconds via the `barometerOptions` object's `frequency` parameter.

The returned watch ID references the barometers's watch interval,
and can be used with `navigator.barometer.clearWatch` to stop watching the
accelerometer.

    var watchID = navigator.barometer.watchPressure(barometerSuccess,
                                                    barometerError,
                                                    [barometerOptions]);

- __barometerOptions__: An object with the following optional keys:
- __frequency__: How often to retrieve the `Pressure` in milliseconds. _(Number)_ (Default: 10000)


###  Example

    function onSuccess(pressure) {
        alert('Pressure: '  + pressure.val + '\n' +
              'Timestamp: ' + pressure.timestamp + '\n');
    };

    function onError() {
        alert('onError!');
    };

    var options = { frequency: 3000 };  // Update every 3 seconds

    var watchID = navigator.barometer.watchPressure(onSuccess, onError, options);

## navigator.barometer.clearWatch

Stop watching the `Pressure` referenced by the `watchID` parameter.

    navigator.barometer.clearWatch(watchID);

- __watchID__: The ID returned by `navigator.barometer.watchPressure`.

###  Example

    var watchID = navigator.barometer.watchPressure(onSuccess, onError, options);

    // ... later on ...

    navigator.barometer.clearWatch(watchID);

## Pressure

Contains `Pressure` data captured at a specific point in time.

### Properties

- __val__:  Amount of pressure. _(Number)_
- __timestamp__: Creation timestamp in milliseconds. _(DOMTimeStamp)_
