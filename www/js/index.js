/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.getElementById('pic').addEventListener('touchstart', this.onPicTouchedStart, false);
        document.getElementById('pic').addEventListener('touchmove', this.onPicTouchedMove, false);
        document.getElementById('pic').addEventListener('touchend', this.onPicTouchedEnd, false);
        document.getElementById('minPressure').addEventListener('change', this.setPressureLimits);
        document.getElementById('maxPressure').addEventListener('change', this.setPressureLimits);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    picInitSize: 100, // px
    minPressure: null, // may vary according to the device and the environment
    maxPressure: null, // may vary according to the device and the environment
    currentCoords: null,
    setPressureLimits: function(e) {
        if (!e) {
            app.minPressure = document.getElementById('minPressure').value;
            app.maxPressure = document.getElementById('maxPressure').value;
        } else {
            if (e.target.id == "minPressure") {
                app.minPressure = parseInt(e.target.value);
            }
            if (e.target.id == "maxPressure") {
                app.maxPressure = parseInt(e.target.value);
            }
        }
    },
    onDeviceReady: function() {
        console.log("Set up");
        var pic = document.getElementById('pic');
        pic.style.position = "fixed";
        pic.style.width = app.picInitSize;
        pic.style.height = app.picInitSize;
        app.setPressureLimits()
    },
    onPicTouchedStart: function(e) {
        console.log(e);
        var coords = {};
        coords.x = e.touches[0].clientX;
        coords.y = e.touches[0].clientY;
        app.currentCoords = coords;
        app.watchPressure();
    },
    onPicTouchedMove: function(e) {
        var coords = {};
        var pic = document.getElementById('pic');
        coords.x = e.touches[0].clientX;
        coords.y = e.touches[0].clientY;
        app.repositionPicAtCoords(pic, coords);
        app.currentCoords = coords;
    },
    onPicTouchedEnd: function(e) {
        console.log("Touch ended");
        if (app.watchID) {
            console.log("Clearing watch " + app.watchID);
            navigator.barometer.clearWatch(app.watchID);
        }
    },
    repositionPicAtCoords: function(pic, coords) {
        pic.style.left = "" + (coords.x - (pic.width / 2)) + "px";
        pic.style.top = "" + (coords.y - (pic.height / 2)) + "px";
    },
    watchPressure: function() {
        var max = app.maxPressure; // These values can change depending on the environment's pressure (calibration?)
        var min = app.minPressure;
        console.log("Pressures: ", max, min);
        var pressureBox = document.getElementById('pressureBox');
        var pic = document.getElementById('pic');
        var initPicSize = app.picInitSize;
        
        function onSuccess(pressure) {
            var current = pressure.val;
            var factor = ((current - min) / (max - min) + 1); // Scale and transpose [0,1] -> [1, 2]
            pressureBox.innerHTML = "" + pressure.val + " / " + factor;
            pic.style.width = initPicSize * Math.pow(factor, 5) + "px";
            pic.style.height = initPicSize * Math.pow(factor, 5) + "px";
            app.repositionPicAtCoords(pic, app.currentCoords); // Keep the pic centered on the finger when resizing
        };

        function onError() {
            pressureBox.innerHTML = "ERROR";
        };

        var options = { frequency: 10 };  // Update every 3 seconds

        app.watchID = navigator.barometer.watchPressure(onSuccess, onError, options);
    }
};

app.initialize();