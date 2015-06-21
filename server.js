'use strict';
//comment_2
process.env.NODE_ENV = 'development';
process.env.HOST = 'http://localhost:8876';
process.env.PORT = 8876;

var port = process.env.PORT || 8877;
var http = require('http');
var path = require('path');
var fs = require("fs");
var express = require('express');
var session = require('express-session');
var logger = require('morgan');
var bodyParser = require('body-parser');
var consolidate = require('consolidate');
var app = express();

app.use(express.static(__dirname + '/public'));
app.engine('html', consolidate.swig);
app.set('views', __dirname + '/public/static');
app.set('view engine', 'html');
app.use(logger('dev'));

app.use(bodyParser.json({strict: false, inflate: false, limit: 1024 * 1024 * 5}));
app.use(bodyParser.urlencoded({extended: false, limit: 1024 * 1024 * 5}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res, next) {
    var html = '';

        html += '<!doctype html>';
        html += '<h2>Test Form to send VoiceMessages</h2>';
        html += '<form method="POST" action="send" enctype="multipart/form-data">';
        html += '<label for="src">src </label>';
        html += '<input type="text" name="src" value="+447441910183"/>';
        html += '<br>';
        html += '<label for="dst">dst </label>';
        html += '<input type="text" name="dst" value="+19192751968"/>';
        //html += '<input type="text" name="dst" value="80936610051"/>';
        //html += '<input type="text" name="dst" value="+3614088916"/>';
        html += '<br>';
        html += '<label for="voiceMsgFile">Voice message file </label>';
        html += '<input type="file" name="voiceMsgFile" />';
        html += '<br>';
        html += '<input type="submit"/>';
        html += '</form>';

        res.send(html);
});

app.post('/send', function (req, res, next) {
    res.status(200).send({success: true});
});

app.get('/transcode', function (req, res, next) {
    console.log('>>> transcode');

    //transcode an audio file
    var sox = require('sox');
    var dirName = path.dirname(require.main.filename);
    var srcFile = 'audio.wav';
    var dstFile = 'audio.mp3';
    var srcFilePath = path.join(dirName, srcFile);
    var dstFilePath = path.join(dirName, dstFile);

    console.log(require.main.filename);
    console.log(srcFilePath);
    console.log(dstFilePath);

    // these options are all default, you can leave any of them off
    var job = sox.transcode(srcFilePath, dstFilePath, {
        sampleRate: 44100,
        format: 'mp3',
        channelCount: 1,
        bitRate: 64 * 1024,
        compressionQuality: 2 // see `man soxformat` search for '-C' for more info
    });

    job.on('error', function(err) {
        console.error(err);
        res.status(500).send({error: err});
    });

    job.on('progress', function(amountDone, amountTotal) {
        console.log("progress", amountDone, amountTotal);
    });
    
    job.on('src', function(info) {
        /* info looks like:
        {
          format: 'wav',
          duration: 1.5,
          sampleCount: 66150,
          channelCount: 1,
          bitRate: 722944,
          sampleRate: 44100,
        }
        */
    });

    job.on('dest', function(info) {
        /* info looks like:
        {
          sampleRate: 44100,
          format: 'mp3',
          channelCount: 2,
          sampleCount: 67958,
          duration: 1.540998,
          bitRate: 196608,
        }
        */
    });

    job.on('end', function() {
        console.log("all done");
        res.status(200).send({success: true});
    });
    
    job.start();
    //res.status(200).send({success: true});
});

app.listen(port, function () {
    console.log('==============================================================');
    console.log('|| server start success on port=' + port + ' in ' + process.env.NODE_ENV + ' version ||');
    console.log('==============================================================\n');
});