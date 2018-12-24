// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const {
    ipcRenderer
} = require('electron')

ipcRenderer.on('comm', (event, arg) => {
    console.log(arg) // prints "pong"
    switch (arg.evt) {
        case 'url':
            webview.setAttribute('src', arg.url);
            break;
        case 'img':
            webview.executeJavaScript(`imageCall("` + encodeURI(arg.url) + `")`);
            break;
        case 'preloadimgs':
            webview.executeJavaScript(`preloadimgs('` + JSON.stringify(arg.urls) + `')`)
            break;
        case 'serialshow':
            serialnum.style.display = 'block';
            serialnum.innerText = arg.serial;
            break;
        case 'serialhide':
            serialnum.style.display = 'none';
            serialnum.innerText = arg.serial;
            break;
        default:
            break;
    }



});

let toarsttimer = undefined;

ipcRenderer.on('toast', (event, arg) => {
    console.log(arg) // prints "pong"
    arg = JSON.parse(arg.data);
    switch (arg.evt) {
        case 'show':
            showmsg(arg);
            break;
    }
});

function showmsg(args) {
    if (toarsttimer !== undefined) {
        clearTimeout(toarsttimer);
        toarsttimer = undefined;
    }
    toastmsg.style.display = 'block';
    toastmsg.innerText = args.msg;
    toarsttimer = setTimeout(function () {
        toarsttimer = undefined;
        toastmsg.innerText = '';
        toastmsg.style.display = 'none';
    }, 5000);
}