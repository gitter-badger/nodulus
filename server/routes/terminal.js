var express = require('express');
var router = express.Router();
var util = require('util');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var spawn = require('child_process').spawn;
global.terminals = {};
global["socket"].on('connection', function (socket) {
    global["rooms"][socket.id] = socket;
    socket.on('terminal.list', function (data) {
        if (global["terminals"]) {
            var retArr = [];
            for (var key in global["terminals"]) {
                retArr.push(key);
            }
            global["socket"].emit('terminal.list', { 'terminals': retArr });
        }
    });
    socket.on('terminal.init', function (data) {
        if (global["terminals"][data] === undefined) {
            var terminal = global["terminals"][data] = spawn('cmd', [], { stdio: ['pipe', 'pipe', 'pipe'] });
            terminal.id = data;
            terminal.stdout.on('data', function (data) {
                data = String.fromCharCode.apply(null, new Uint16Array(data));
                global["socket"].emit('terminal.result', { 'id': terminal.id, 'stdout': data, 'stderr': null });
            });
            terminal.stdout.on('message', function (data) {
                data = String.fromCharCode.apply(null, new Uint16Array(data));
                global["socket"].emit('terminal.result', { 'id': terminal.id, 'stdout': data, 'stderr': null });
            });
            terminal.stderr.on('data', function (data) {
                data = String.fromCharCode.apply(null, new Uint16Array(data));
                global["socket"].emit('terminal.result', { 'id': terminal.id, 'stdout': data, 'stderr': null });
            });
            terminal.stderr.on('close', function (data) {
                debugger;
            });
        }
        global["socket"].emit('terminal.init', { 'id': data });
    });
    socket.on('terminal.command', function (data) {
        var command = data.command + '\n';
        var terminal_id = data.id;
        var terminal = global["terminals"][terminal_id];
        terminal.stdin.setEncoding('utf-8');
        terminal.stdin.write(command);
    });
});
function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2);
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i > strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
module.exports = router;
