const Store = require('electron-store');
const internetAvailable = require('internet-available');
const evt = require('./events')
const ip = require('ip');

const Global = {};
Global.init = function () {

    internetLookup();
    Global.localip = ip.address();


    getMac().then((mac) => {
        Global.mac = mac;
        console.log(mac)
    })

}

Global.apidomain = 'http://traveltrack.goyo.in';
Global.apiurl = Global.apidomain + '/api/client';
Global.mqtt = "mqtt://traveltrack.goyo.in"
Global.mac = '';
Global.localip = '';
Global.SerialNo = '';
Global.IsRegistered = false;

Global.Store = new Store();

Global.isInternetAvail = false;

function internetLookup() {
    // Most easy way
    internetAvailable({
        // Provide maximum execution time for the verification
        timeout: 5000,
        // If it tries 5 times and it fails, then it will throw no internet
        retries: 5
    }).then(() => {
        if (!Global.isInternetAvail) {
            evt.pubsub.emit('internet', true);
            Global.isInternetAvail = true;
        }
        setTimeout(internetLookup, 5000);
        // console.log("Internet available");
    }).catch(() => {
        if (Global.isInternetAvail) {
            evt.pubsub.emit('internet', false);
            Global.isInternetAvail = false;
        }
        setTimeout(internetLookup, 5000);
        // console.log("No internet");
    });




}


function getMac() {
    return new Promise(function (resolve, reject) {
        require('getmac').getMac(function (err, macAddress) {
            if (err) {
                console.log(err);
                reject(err);
                throw err;
            }
            resolve(macAddress);
        });
    });
}



module.exports = Global;