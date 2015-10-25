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
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        // app.receivedEvent('deviceready');
        // app.watchPressure();
    },
    onPicTouchedStart: function(e) {
        console.log(e);
        app.watchPressure();
    },
    onPicTouchedMove: function(e) {
        var coords = {};
        coords.x = e.touches[0].clientX;
        coords.y = e.touches[0].clientY;
        var pic = document.getElementById('pic');
        pic.style.left = "" + (coords.x - (pic.width / 2)) + "px";
        pic.style.top = "" + (coords.y - (pic.height / 2)) + "px";
    },
    onPicTouchedEnd: function(e) {
        console.log("Touch ended");
        if (app.watchID) {
            console.log("Clearing watch " + app.watchID);
            navigator.barometer.clearWatch(app.watchID);
        }
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    watchPressure: function() {
        var max = 1020.0; // These values can change depending on the environment's pressure (calibration?)
        var min = 1010.0;
        var pressureBox = document.getElementById('pressureBox');
        var pic = document.getElementById('pic');
        var initPicSize = pic.width;
        
        function onSuccess(pressure) {
            var current = pressure.val;
            var factor = ((current - min) / (max - min) + 1); // Scale and transpose [0,1] -> [1, 2]
            pressureBox.innerHTML = "" + pressure.val + " / " + factor;
            pic.width = initPicSize * Math.pow(factor, 2);
            pic.height = initPicSize * Math.pow(factor, 2);
        };

        function onError() {
            pressureBox.innerHTML = "ERROR";
        };

        var options = { frequency: 10 };  // Update every 3 seconds

        app.watchID = navigator.barometer.watchPressure(onSuccess, onError, options);
    }
};

app.initialize();