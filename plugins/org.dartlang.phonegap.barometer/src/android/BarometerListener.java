// Copyright (c) 2014, the Dart project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

package org.dartlang.phonegap.barometer;

import java.util.List;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import android.os.Handler;
import android.os.Looper;

/**
 * This class listens to the barometer sensor and stores the latest
 * pressure value.
 */
public class BarometerListener extends CordovaPlugin implements SensorEventListener {

    public static int STOPPED = 0;
    public static int STARTING = 1;
    public static int RUNNING = 2;
    public static int ERROR_FAILED_TO_START = 3;
   
    private float pressure;  // most recent pressure value
    private long timestamp;  // time of most recent value
    private int status;  // status of listener
    private int accuracy = SensorManager.SENSOR_STATUS_UNRELIABLE;

    private SensorManager sensorManager;  // Sensor manager
    private Sensor mSensor;  // Pressure sensor returned by sensor manager

    private CallbackContext callbackContext;  // Keeps track of the JS callback context.

    private Handler mainHandler=null;
    private Runnable mainRunnable = new Runnable() {
        public void run() {
            BarometerListener.this.timeout();
        }
    };

    /**
     * Create an barometer listener.
     */
    public BarometerListener() {
        this.pressure = 0;
        this.timestamp = 0;
        this.setStatus(BarometerListener.STOPPED);
     }

    /**
     * Sets the context of the Command. This can then be used to do things like
     * get file paths associated with the Activity.
     *
     * @param cordova The context of the main Activity.
     * @param webView The associated CordovaWebView.
     */
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        this.sensorManager = (SensorManager) cordova.getActivity().getSystemService(Context.SENSOR_SERVICE);
    }

    /**
     * Executes the request.
     *
     * @param action        The action to execute.
     * @param args          The exec() arguments.
     * @param callbackId    The callback id used when calling back into JavaScript.
     * @return              Whether the action was valid.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        if (action.equals("start")) {
            this.callbackContext = callbackContext;
            if (this.status != BarometerListener.RUNNING) {
                // If not running, then this is an async call, so don't worry about waiting
                // We drop the callback onto our stack, call start, and let start and the sensor callback fire off the callback down the road
                this.start();
            }
        }
        else if (action.equals("stop")) {
            if (this.status == BarometerListener.RUNNING) {
                this.stop();
            }
        } else {
          // Unsupported action
            return false;
        }

        PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT, "");
        result.setKeepCallback(true);
        callbackContext.sendPluginResult(result);
        return true;
    }

    /**
     * Called by BarometerBroker when listener is to be shut down.
     * Stop listener.
     */
    public void onDestroy() {
        this.stop();
    }

    //--------------------------------------------------------------------------
    // LOCAL METHODS
    //--------------------------------------------------------------------------
    //
    /**
     * Start listening for pressure sensor.
     * 
     * @return          status of listener
    */
    private int start() {
        // If already starting or running, then just return
        if ((this.status == BarometerListener.RUNNING) || (this.status == BarometerListener.STARTING)) {
            return this.status;
        }

        this.setStatus(BarometerListener.STARTING);

        // Get barometer from sensor manager
        List<Sensor> list = this.sensorManager.getSensorList(Sensor.TYPE_PRESSURE);

        // If found, then register as listener
        if ((list != null) && (list.size() > 0)) {
          this.mSensor = list.get(0);
          this.sensorManager.registerListener(this, this.mSensor, SensorManager.SENSOR_DELAY_UI);
          this.setStatus(BarometerListener.STARTING);
        } else {
          this.setStatus(BarometerListener.ERROR_FAILED_TO_START);
          this.fail(BarometerListener.ERROR_FAILED_TO_START, "No sensors found to register barometer listening to.");
          return this.status;
        }

        // Set a timeout callback on the main thread.
        stopTimeout();
        mainHandler = new Handler(Looper.getMainLooper());
        mainHandler.postDelayed(mainRunnable, 2000);

        return this.status;
    }
    private void stopTimeout() {
        if(mainHandler!=null){
            mainHandler.removeCallbacks(mainRunnable);
        }
    }
    /**
     * Stop listening to barometer sensor.
     */
    private void stop() {
        stopTimeout();
        if (this.status != BarometerListener.STOPPED) {
            this.sensorManager.unregisterListener(this);
        }
        this.setStatus(BarometerListener.STOPPED);
        this.accuracy = SensorManager.SENSOR_STATUS_UNRELIABLE;
    }

    /**
     * Returns an error if the sensor hasn't started.
     *
     * Called two seconds after starting the listener.
     */
    private void timeout() {
        if (this.status == BarometerListener.STARTING) {
            this.setStatus(BarometerListener.ERROR_FAILED_TO_START);
            this.fail(BarometerListener.ERROR_FAILED_TO_START, "Barometer could not be started.");
        }
    }

    /**
     * Called when the accuracy of the sensor has changed.
     *
     * @param sensor
     * @param accuracy
     */
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Only look at barometer events
        if (sensor.getType() != Sensor.TYPE_PRESSURE) {
            return;
        }

        // If not running, then just return
        if (this.status == BarometerListener.STOPPED) {
            return;
        }
        this.accuracy = accuracy;
    }

    /**
     * Sensor listener event.
     *
     * @param SensorEvent event
     */
    public void onSensorChanged(SensorEvent event) {
        // Only look at barometer events
        if (event.sensor.getType() != Sensor.TYPE_PRESSURE) {
            return;
        }

        // If not running, then just return
        if (this.status == BarometerListener.STOPPED) {
            return;
        }
        this.setStatus(BarometerListener.RUNNING);

        if (this.accuracy >= SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM) {

            // Save time that event was received
            this.timestamp = System.currentTimeMillis();
            this.pressure = event.values[0];

            this.win();
        }
    }

    /**
     * Called when the view navigates.
     */
    @Override
    public void onReset() {
        if (this.status == BarometerListener.RUNNING) {
            this.stop();
        }
    }

    // Sends an error back to JS
    private void fail(int code, String message) {
        // Error object
        JSONObject errorObj = new JSONObject();
        try {
            errorObj.put("code", code);
            errorObj.put("message", message);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        PluginResult err = new PluginResult(PluginResult.Status.ERROR, errorObj);
        err.setKeepCallback(true);
        callbackContext.sendPluginResult(err);
    }

    private void win() {
        // Success return object
        PluginResult result = new PluginResult(PluginResult.Status.OK, this.getPressureJSON());
        result.setKeepCallback(true);
        callbackContext.sendPluginResult(result);
    }

    private void setStatus(int status) {
        this.status = status;
    }
    private JSONObject getPressureJSON() {
        JSONObject r = new JSONObject();
        try {
            r.put("val", this.pressure);
            r.put("timestamp", this.timestamp);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return r;
    }
}
