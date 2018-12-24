// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain,
  webFrame
} = require('electron')
var bodyParser = require('body-parser');
const global = require('./global/global')
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var upload = multer({
  limits: {
    fieldNameSize: 999999999,
    fieldSize: 999999999
  },
  dest: 'www/mobile/mord'
});

var extract = require('extract-zip')
global.init();

const evt = require('./global/events')

global.SerialNo = getserial();


//event fire when internet available/not 
evt.pubsub.on('internet', function (data) {
  console.log(data);
});

process.on('uncaughtException', function (err) {
  console.log(err);
})
// const pytalk = require('pytalk');

// let worker = pytalk.worker('pycom.py');

// let msg = worker.method('msg');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let api;
// app.disableHardwareAcceleration();


function createWindow() {



  // Create the browser window.
  // let loading = new BrowserWindow({
  //   show: false,
  //   frame: false
  // })
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false
  });
  mainWindow.setKiosk(true);
  mainWindow.setMenu(null)
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  api = require('./api.js')(mainWindow)

  // webFrame.setVisualZoomLevelLimits(1, 1);
  // webFrame.setLayoutZoomLevelLimits(0, 0);
  // start mqtt
  // require('./mqttc/mqttcl')(api, global);

  mainWindow.webContents.on('did-finish-load', () => {
    // Send Message
    api.init();

  });

  // // http version
  var express = require('express')
  var expapp = express()
  expapp.use(bodyParser.json());
  expapp.use(bodyParser.urlencoded({
    extended: true
  }));

  expapp.post('/api', function (req, res) {
    // console.log(req.body)
    let param = req.body;

    var resa = api[param.func](param);
    if (resa) {
      res.send(resa)
    } else {
      res.send('OK')
    }

  })

  expapp.post("/uploadFile", upload.any(), function (req, res) {

    console.log(app.getPath('home'));

    var tmp_path = req.files[0].path;
    req.body.uploadimg = req.files[0].originalname;


    var dir = path.resolve(app.getPath('home'), 'playlist');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    } else {
      fs.readdir(dir, (err, files) => {
        if (err) console.log(err);
        for (const file of files) {
          fs.unlink(path.join(dir, file), err => {
            if (err) console.log(err);
          });
        }
      });
    }

    var target_path = path.resolve(dir, req.files[0].originalname);
    var src = fs.createReadStream(tmp_path);
    var dest = fs.createWriteStream(target_path);

    src.pipe(dest);

    fs.unlink(req.files[0].path, function (err) {
      if (err) {
        res.send({
          error: err
        });
        return; // console.log(err);
      }
    });

    src.on('end', function () {
      // mnlord.saveManualOrder(req, res);
      extract(target_path, {
        dir: dir
      }, function (err) {
        if (err) {
          res.send({
            "status": 'error',
            "err": err
          });
          return;
        }
        // playlist file
        api['loadPlaylist']();
        res.send({
          "status": "done"
        });
        // extraction is complete. make sure to handle the err
      })


    });

    src.on('error', function (err) {
      res.send({
        error: "upload failed"
      });
      // console.log(err);
    });
  });


  expapp.listen(8976, () => console.log('Example app listening on port 8976!'))

  // setInterval(function () {
  //   if (mainWindow) {
  //     mainWindow.webContents.send('log', 'test')
  //     msg('test message', (err, blurred) => {

  //       console.log(`Saved to ${err}`);
  //     });
  //   }
  // }, 2000);

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here


function getserial() {

  // return '000012033301';

  var fs = require('fs');
  var content = fs.readFileSync('/proc/cpuinfo', 'utf8');
  var cont_array = content.split("\n");
  var serial_line = cont_array[cont_array.length - 2];
  var serial = serial_line.split(":");
  return serial[1].slice(1);

}