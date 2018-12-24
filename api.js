const fs = require('fs');
const Global = require('./global/global');
const electron = require('electron').app
const os = require('os-utils');
const hddSpace = require('hdd-space');
const si = require('systeminformation');
const request = require("request");
var path = require('path');
const {
    exec
} = require('child_process');
const screenshot = require('screenshot-desktop')
const imagemin = require('imagemin');
const omxp = require('omxplayer-controll');
let counterTimer = undefined;
const globals = require('./global/global')
const cpudet = {
    cpu: 0,
    ram: 0,
    freemem: 0,
    totlmem: 0,
    freememper: 0,
    totdisk: 0,
    freedisk: 0,
    temp: 0,
    cpuct: os.cpuCount(),

}
// require('child_process').spawn(
//     'sudo',
//     'python',
//     // second argument is array of parameters, e.g.:
//     ["/home/pi/startup/run.py"]
// );


// var myPythonScriptPath = '/home/pi/startup/run.py';

// // Use python shell
// var PythonShell = require('python-shell');
// var pyshell = new PythonShell(myPythonScriptPath);

// pyshell.on('message', function (message) {
//     // received a message sent from the Python script (a simple "print" statement)
//     console.log(message);
// });

// // end the input stream and allow the process to exit
// pyshell.end(function (err) {
//     if (err) {
//         throw err;
//     };

//     console.log('finished');
// });


setInterval(function () {

    // os.cpuUsage(function (v) {
    //     cpudet.cpu = (v * 100).toFixed(2);
    // });

    // os.cpuFree(function (v) {

    //     cpudet.ram = (v * 100).toFixed(2);
    // });

    si.currentLoad(function (v) {
        cpudet.cpu = v.currentload.toFixed(0);

    });

    hddSpace(function (info) {
        cpudet.totdisk = (info.total.size / 1024 / 1024 / 1024).toFixed(0)
        cpudet.freedisk = (info.total.free / 1024 / 1024 / 1024).toFixed(0)
    });

    si.cpuTemperature().then((val) => {
        cpudet.temp = val.main;
    })

    si.mem().then((val) => {
        cpudet.freemem = (val.free / 1024 / 1024).toFixed(2);
        cpudet.totlmem = (val.total / 1024 / 1024).toFixed(2);
        cpudet.freememper = (cpudet.freemem / cpudet.totlmem).toFixed(0)


    })

    // console.log(cpudet);
}, 4000);


// exec('sudo service bluetooth restart', (err, stdout, stderr) => {
//     if (err) {
//         // writelog(err)
//         // node couldn't execute the command
//         return;
//     }
// });


module.exports = function (win) {

    var modulex = {};

    const opts = {
        'audioOutput': 'hdmi', //  'hdmi' | 'local' | 'both'
        'blackBackground': false, //false | true | default: true
        'disableKeys': true, //false | true | default: false
        'disableOnScreenDisplay': false, //false | true | default: false
        'disableGhostbox': false, //false | true | default: false
        'subtitlePath': '', //default: ""
        'startAt': 0, //default: 0
        'startVolume': 0.8, //0.0 ... 1.0 default: 1.0
        'closeOtherPlayers': true,
        'maxPlayerAllowCount': 1,
        'orientation': 90
    };




    modulex.init = function () {
        // init module on startup
        try {
            // const defurl = this.getConfigByKey('url')
            // if (defurl !== '') {
            //     this.url({
            //         url: defurl
            //     })
            // }
            this.url({
                url: __dirname + '/assests/imageview.html'
            })
            this.loadPlaylist();

            const isreg = this.getConfigByKey('isreg')
            if (isreg === 'yes') {
                Global.IsRegistered = isreg;
            }

            let isserialshow = this.getConfigByKey('isserialshow')
            if (isserialshow === '') {
                isserialshow = 'true'
            }
            console.log(isserialshow);
            if (isserialshow === 'true') {
                this.serial({
                    evt: 'serialshow',
                    serial: globals.SerialNo
                })
            }

        } catch (Ex) {

        }
    };


    modulex.reload = function () {
        win.reload();
        // This will be available 'outside'.
        // Authy stuff that can be used outside...
    };

    modulex.reboot = function () {

        exec('sudo reboot', (err, stdout, stderr) => {
            if (err) {
                // node couldn't execute the command
                return;
            }
        });
        // This will be available 'outside'.
        // Authy stuff that can be used outside...
    };

    modulex.rebootapp = function () {
        electron.relaunch()
        // This will be available 'outside'.
        // Authy stuff that can be used outside...
    };

    modulex.rotate = function (data) {

        this.toast('data');
        exec("xrandr --output HDMI-1 --rotate " + data.orientation, (err, stdout, stderr) => {
            if (err) {
                // node couldn't execute the command
                return;
            }
        });

        // This will be available 'outside'.
        // Authy stuff that can be used outside...
    };

    modulex.bluetooth = function (data) {
        win.webContents.send('comm', data)
    };

    modulex.toast = function (data) {
        win.webContents.send('toast', data)
    };
    modulex.serial = function (data) {
        this.setConfig('isserialshow', (data.evt === 'serialshow' ? 'true' : 'false'));
        win.webContents.send('comm', {
            evt: data.evt,
            serial: data.serial
        })
    };

    modulex.url = function (data) {
        data.evt = 'url';
        win.webContents.send('comm', data)
        // win.loadURL(data.url);
        if (data.persist) {
            this.setConfig('url', data.url);
        }
        // This will be available 'outside'.
        // Authy stuff that can be used outside...
    };

    modulex.local = function (url) {
        win.loadFile('index.html')
        // This will be available 'outside'.
        // Authy stuff that can be used outside...
    };

    modulex.screenshot = function (data, serialNo, clients) {
        screenshot().then((img) => {
            return img
        }).then((img) => {
            return imagemin.buffer(img)
        }).then((imaged) => {
            return imaged.toString('base64');
        }).then((result) => {
            if (!clients) return;
            clients.publish('client/' + serialNo + '/msg', JSON.stringify({
                    cmd: 'screenshot',
                    data: result
                }), {
                    retain: false
                },
                function () {
                    console.log("Message is published");
                    //   client.end(); // Close the connection when published
                });

        }).catch((err) => {
            // ...
            console.log(err);
        })

        // This will be available 'outside'.
        // Authy stuff that can be used outside...
    };

    modulex.terminal = function (data, serialNo, clients) {
        exec(data, (err, stdout, stderr) => {
            if (err) {
                // node couldn't execute the command
                return;
            }
        });
    }

    modulex.checkRegister = function (key, config) {
        request.post({
                "headers": {
                    "content-type": "application/json"
                },
                "url": Global.apiurl + '/checkreg',
                "body": JSON.stringify({
                    "clientid": Global.SerialNo
                })
            },
            (error, response, body) => {
                if (error) {
                    return console.dir(error);
                }
                // console.dir(JSON.parse(body));
            });
    };

    modulex.setConfig = function (key, config) {
        // This will be available 'outside'.
        // Authy stuff that can be used outside...
        Global.Store.set('config' + '.' + key, config)
    };


    modulex.getConfig = function () {
        return Global.Store.get('config', '');
        // This will be available 'outside'.
        // Authy stuff that can be used outside...
    };


    modulex.getConfigByKey = function (key) {
        return Global.Store.get('config.' + key, '');
        // This will be available 'outside'.
        // Authy stuff that can be used outside...
    };

    modulex.devinfo = function (data, serialNo, clients) {
        clients.publish('client/' + serialNo + '/msg', JSON.stringify({
                cmd: 'devinfo',
                data: cpudet.cpu + "|" + cpudet.cpuct + "|" + cpudet.freemem +
                    "|" + cpudet.totlmem + "|" + cpudet.freememper + "|" + cpudet.ram +
                    "|" + cpudet.totdisk + "|" + cpudet.freedisk + "|" + cpudet.temp
            }), {
                retain: false
            },
            function () {
                // console.log("Message is published");
                //   client.end(); // Close the connection when published
            });
    }


    modulex.vidplayer = function (data, serialNo, clients) {
        // init module on startup
        omxp.open(data.path, opts);

    };
    modulex.loadPlaylist = function () {
        var dir = path.resolve(electron.getPath('home'), 'playlist');
        // var dir = path.resolve(__dirname, 'playlist');
        const data = fs.readFileSync(path.resolve(dir, 'play.txt')).toString();
        let dts = [];
        const playlist = data.split('\n');
        let dailysec = 0;
        let preloadimg = [];
        for (let i = 0; i < playlist.length; i++) {
            const el = playlist[i];
            const dt = el.split(',')
            if (dt[1]) {
                const tm = dt[1];
                let tms = parseInt(tm.replace('s', ''));
                dailysec += tms;
                dts.push({
                    'url': path.resolve(dir, dt[0]),
                    'time': dailysec
                });
                preloadimg.push(path.resolve(dir, dt[0]));
            }
        }
        win.webContents.send('comm', {
            "evt": "preloadimgs",
            "urls": preloadimg
        })
        this.startPlaylist(dts);
    };

    modulex.startPlaylist = function (data) {
        if (counterTimer !== undefined) {
            clearInterval(counterTimer);
            counterTimer = undefined;
        }
        let that = this
        const numofrec = data.length - 1;
        let counter = 0;
        let seconds = 0;
        win.webContents.send('comm', {
            evt: "img",
            url: data[counter].url
        })
        counterTimer = setInterval(() => {
            if (seconds > data[counter].time) {
                if (counter == numofrec) {
                    counter = 0;
                    seconds = 0;
                } else {
                    counter++;
                }
                win.webContents.send('comm', {
                    evt: "img",
                    url: data[counter].url
                })
            }
            seconds += 1;
        }, 1000);
    };


    omxp.on('changeStatus', function (status) {
        console.log('Status', status);
    });
    omxp.on('aboutToFinish', function () {
        console.log('File about to finish');
    });


    return modulex;
};