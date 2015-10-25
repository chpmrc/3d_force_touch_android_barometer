cordova.define("org.dartlang.phonegap.barometer.barometer", function(require, exports, module) { // Copyright (c) 2014, the Dart project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

/**
 * This class provides access to device barometer data.
 * @constructor
 */
var argscheck = require('cordova/argscheck'),
    utils = require("cordova/utils"),
    exec = require("cordova/exec"),
    Acceleration = require('./Pressure');

// Is the barometer sensor running?
var running = false;

// Keeps reference to watchPressure calls.
var timers = {};

// Array of listeners; used to keep track of when we should call start and stop.
var listeners = [];

// Last returned pressure object from native
var pressure = null;

// Tells native to start.
function start() {
    exec(function(a) {
        var tempListeners = listeners.slice(0);
        pressure = new Pressure(a.val, a.timestamp);
        for (var i = 0, l = tempListeners.length; i < l; i++) {
            tempListeners[i].win(pressure);
        }
    }, function(e) {
        var tempListeners = listeners.slice(0);
        for (var i = 0, l = tempListeners.length; i < l; i++) {
            tempListeners[i].fail(e);
        }
    }, "Barometer", "start", []);
    running = true;
}

// Tells native to stop.
function stop() {
    exec(null, null, "Barometer", "stop", []);
    running = false;
}

// Adds a callback pair to the listeners array
function createCallbackPair(win, fail) {
    return {win:win, fail:fail};
}

// Removes a win/fail listener pair from the listeners array
function removeListeners(l) {
    var idx = listeners.indexOf(l);
    if (idx > -1) {
        listeners.splice(idx, 1);
        if (listeners.length === 0) {
            stop();
        }
    }
}

var barometer = {
    /**
     * Asynchronously acquires the current pressure.
     *
     * @param {Function} successCallback    The function to call when the pressure data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the pressure data. (OPTIONAL)
     * @param {BarometerOptions} options    The options for getting the barometer data such as frequency. (OPTIONAL)
     */
    getCurrentPressure: function(successCallback, errorCallback, options) {
        argscheck.checkArgs('fFO', 'barometer.getCurrentPressure', arguments);

        var p;
        var win = function(a) {
            removeListeners(p);
            successCallback(a);
        };
        var fail = function(e) {
            removeListeners(p);
            errorCallback && errorCallback(e);
        };

        p = createCallbackPair(win, fail);
        listeners.push(p);

        if (!running) {
            start();
        }
    },

    /**
     * Asynchronously acquires the pressure repeatedly at a given interval.
     *
     * @param {Function} successCallback    The function to call each time the pressure data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the pressure data. (OPTIONAL)
     * @param {BarometerOptions} options    The options for getting the barometer data such as frequency. (OPTIONAL)
     * @return String                       The watch id that must be passed to #clearWatch to stop watching.
     */
    watchPressure: function(successCallback, errorCallback, options) {
        argscheck.checkArgs('fFO', 'barometer.watchPressure', arguments);
        // Default interval (10 sec)
        var frequency = (options && options.frequency && typeof options.frequency == 'number') ? options.frequency : 10000;

        // Keep reference to watch id, and report pressure readings as often as defined in frequency
        var id = utils.createUUID();

        var p = createCallbackPair(function(){}, function(e) {
            removeListeners(p);
            errorCallback && errorCallback(e);
        });
        listeners.push(p);

        timers[id] = {
            timer:window.setInterval(function() {
                if (pressure) {
                    successCallback(pressure);
                }
            }, frequency),
            listeners:p
        };

        if (running) {
            // If we're already running then immediately invoke the success callback
            // but only if we have retrieved a value, sample code does not check for null ...
            if (pressure) {
                successCallback(pressure);
            }
        } else {
            start();
        }

        return id;
    },

    /**
     * Clears the specified barometer watch.
     *
     * @param {String} id       The id of the watch returned from #watchPressure.
     */
    clearWatch: function(id) {
        // Stop javascript timer & remove from timer list
        if (id && timers[id]) {
            window.clearInterval(timers[id].timer);
            removeListeners(timers[id].listeners);
            delete timers[id];
        }
    }
};
module.exports = barometer;

});
