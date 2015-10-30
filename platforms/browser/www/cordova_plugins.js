cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/org.dartlang.phonegap.barometer/www/Pressure.js",
        "id": "org.dartlang.phonegap.barometer.Pressure",
        "clobbers": [
            "Pressure"
        ]
    },
    {
        "file": "plugins/org.dartlang.phonegap.barometer/www/barometer.js",
        "id": "org.dartlang.phonegap.barometer.barometer",
        "clobbers": [
            "navigator.barometer"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.0.0",
    "org.dartlang.phonegap.barometer": "0.0.2"
}
// BOTTOM OF METADATA
});