/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
    recording = false;
var seconds = 0, 
    minutes = 0,
    hours = 0;
	addrow = 3;
var myVar = setInterval(TimerDisplay, 1000);
var StartTime = new Date();
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;

/* TODO:

- offer mono option
- "Monitor input" switch
*/

function saveAudio() {
    audioRecorder.exportWAV( doneEncoding );
    // could get mono instead by saying
    // audioRecorder.exportMonoWAV( doneEncoding );
}

function gotBuffers( buffers ) {
    var canvas = document.getElementById( "wavedisplay" );

    drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );

    // the ONLY time gotBuffers is called is right after a new recording is completed - 
    // so here's where we should set up the download.
    audioRecorder.exportWAV( doneEncoding );
}

function doneEncoding( blob ) {
    Recorder.setupDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav" );
    recIndex++;
}

function toggleRecording( e ) {
    //if (e.classList.contains("recording")) {
       if(recording){
		//stop recording
        audioRecorder.stop();
	recording = false;
       document.getElementById("record").src = "img/Record_icon.png";
	//recording = false;
       // e.classList.remove("recording");
       // audioRecorder.getBuffers( gotBuffers );
	document.getElementById("Recordingtime").innerHTML= hours +":"+ minutes + ":" + seconds;
	//clearInterval(myVar); //reserve this for stop recording action
	   }
	//} 
	else {
        //start recording
        if (!audioRecorder)
            return;
        //e.classList.add("recording");
	//e.images.src = "img/Hold.jpg";
         document.getElementById("record").src = "img/Hold_icon.png";		   
      // audioRecorder.clear(); reserve this function for the stop recording action
        audioRecorder.record();
	//TimerDisplay();
	recording = true;
        //Start timer
	//var Start_time = new Date();
	//StartTime = Start_time;
			
    }
}

function toggleStop(e){
    //if (e.classList.contains("recording")) {
     //  if(recording){
	//stop recording
	document.getElementById("record").src = "img/Record_icon.png";
        audioRecorder.stop();
	recording = false;
	//recording = false;
        e.classList.remove("recording");
        audioRecorder.getBuffers( gotBuffers );
	document.getElementById("Recordingtime").innerHTML= hours +":"+ minutes + ":" + seconds;
	clearInterval(myVar); //reserve this for stop recording action
	//   }
	//} 
}

function TimerDisplay() {
	if(recording){
	  seconds++;
	  if (seconds == 60){ 
	      seconds =0;
	      minutes ++;
	  }
	  if (minutes == 60){
	      minutes = 0;
	      hours++;
	  }
	  document.getElementById("Recordingtime").innerHTML= hours +":"+ minutes + ":" + seconds;
    }
}


function functiontitle1 (x) {
	if (recording){
        x.style.background = "yellow";
	document.getElementById("label1").innerHTML= hours +":"+ minutes + ":" + seconds;
	}
}

function functiontitle2 (x) {
	if (recording){
	x.style.background = "yellow";
	document.getElementById("label2").innerHTML= hours +":"+ minutes + ":" + seconds;
	}
}


$(document).ready(function(){
    $('Table tr').click(function(e){
        var cell = $(e.target).get(0);
        var tr = $(this);
        $('td', tr).each(function(i, td){
			if(i==1)
            {
			td.innerHTML = hours +":"+ minutes + ":" + seconds;	
			} 
        });
    });
});


function AddFunction(){
	addrow = addrow + 1;
    var table = document.getElementById("Table");
    var row = table.insertRow(-1);
	var cell1 = row.insertCell(0);
	cell1.setAttribute('contenteditable', 'true');
    var cell2 = row.insertCell(1);
    cell1.innerHTML = "Text..";
    cell2.innerHTML = "0:00:00";
}


function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

function cancelAnalyserUpdates() {
    window.cancelAnimationFrame( rafID );
    rafID = null;
}

function updateAnalysers(            ) {
    if (!analyserContext) {
        var canvas = document.getElementById("analyser");
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        analyserContext = canvas.getContext('2d');
    }

    // analyzer draw code here
    {
        var SPACING = 3;
        var BAR_WIDTH = 1;
        var numBars = Math.round(canvasWidth / SPACING);
        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

        analyserNode.getByteFrequencyData(freqByteData); 

        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        analyserContext.fillStyle = '#F6D565';
        analyserContext.lineCap = 'round';
        var multiplier = analyserNode.frequencyBinCount / numBars;

        // Draw rectangle for each frequency bin.
        for (var i = 0; i < numBars; ++i) {
            var magnitude = 0;
            var offset = Math.floor( i * multiplier );
            // gotta sum/average the block, or we miss narrow-bandwidth spikes
            for (var j = 0; j< multiplier; j++)
                magnitude += freqByteData[offset + j];
            magnitude = magnitude / multiplier;
            var magnitude2 = freqByteData[i * multiplier];
            analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
            analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
        }
    }
    
    rafID = window.requestAnimationFrame( updateAnalysers );
}

function toggleMono() {
    if (audioInput != realAudioInput) {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput = realAudioInput;
    } else {
        realAudioInput.disconnect();
        audioInput = convertToMono( realAudioInput );
    }

    audioInput.connect(inputPoint);
}

function gotStream(stream) {
    inputPoint = audioContext.createGain();

    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

//    audioInput = convertToMono( input );

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect( analyserNode );

    audioRecorder = new Recorder( inputPoint );

    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
    updateAnalysers();
}

function initAudio() {
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, function(e) {
            alert('Error getting audio');
            console.log(e);
        });
}

window.addEventListener('load', initAudio );
