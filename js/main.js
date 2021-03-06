/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

'use strict';

/* globals MediaRecorder */



class Timer {
    constructor(div) {
        this.div = div;
        this.duration = 0;
        this.interval = null;

        this.warning = document.querySelector('#time-warning')
        this.finalWarning = document.querySelector('#final-time-warning')
    }
    start() {
        this.duration = 0;
        this.div.style.display = 'block';
        this.div.textContent = new Date(this.duration * 1000).toISOString().substr(14, 5);
        this.interval = setInterval(this.increment.bind(this), 1000);
    }
    increment() {
        this.duration++;
        this.div.textContent = new Date(this.duration * 1000).toISOString().substr(14, 5);

        if (this.duration > 110) {
            this.finalWarning.style.display = 'block';
            this.warning.style.display = 'none';
        } else if (this.duration > 90) {
            this.warning.style.display = 'block'
        }
    }
    stop() {
        clearInterval(this.interval)
        this.interval = null;
    }
}


let mediaRecorder;
let recordedBlobs;


const recorder = document.querySelector('#recorder');
const recordingDone = document.querySelector('#recordingDone');
const errorMsgElement = document.querySelector('span#errorMsg');
const recordButton = document.querySelector('button#record');

const timer = new Timer(document.querySelector('#timer'))

recordButton.addEventListener('click', () => {
    if (recordButton.textContent === 'Start Recording') {
        startRecording();
    } else {
        recordButton.disabled = true;
        stopRecording();

        recorder.classList.remove('show');
        recordingDone.classList.add('show');

        loadForNextPerson(5);
    }
});


const countdown = document.querySelector('#countdown');
function loadForNextPerson(countdownNumber) {
    if (countdownNumber === 0) {
        window.location = 'index.html';
        return;
    }

    countdown.textContent = countdownNumber;
    setTimeout(() => {
        countdownNumber--;
        loadForNextPerson(countdownNumber);
    }, 1000);
}

function doDownload() {
    let filename = 'unknown.webm'
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const bibNumber = urlParams.get('bib').padStart(3, '0');
    if (urlParams.has('bib')) {
        filename = 'video-' + bibNumber + '.webm';
    }

    const blob = new Blob(recordedBlobs, {type: 'video/webm'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

function startRecording() {
    timer.start()

    recordedBlobs = [];
    const mimeType = 'video/webm;codecs=vp8,opus';
    const options = {mimeType};

    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
        console.error('Exception while creating MediaRecorder:', e);
        errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
        return;
    }

    recordButton.textContent = 'Stop Recording';
    recordButton.classList.remove('btn-success');
    recordButton.classList.add('btn-danger');

    mediaRecorder.onstop = (event) => {
        doDownload();
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
}

function stopRecording() {
    timer.stop()
    mediaRecorder.stop();
}

function handleSuccess(stream) {
    recordButton.disabled = false;
    window.stream = stream;

    const gumVideo = document.querySelector('video#gum');
    gumVideo.srcObject = stream;
}

async function init(constraints) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream);
    } catch (e) {
        console.error('navigator.getUserMedia error:', e);
        errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
    }
}


navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
        devices.forEach(function(device) {
            console.log(device.kind + ": " + device.label +
                " id = " + device.deviceId);
        });
    })
    .catch(function(err) {
        console.log(err.name + ": " + err.message);
    });


const constraints = {
    audio: { echoCancellation: {exact: false} },
    video: { width: 1280, height: 720 }
};

init(constraints).then();
