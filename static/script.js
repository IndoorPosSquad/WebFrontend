/*
   The MIT License (MIT)

   Copyright (c) 2013 Richard Teammco

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   THE SOFTWARE.
 */


/* JavaScript code for the Kalman Filter page:
 *	all Kalman Filter algorithm code is in kalmanFilter.js...
 *	This file just contains code for setting up the GUI, including
 *	the jQuery UI sliders, and interactive matrix tables, etc.
 */


// MATRIX DEFAULT VALUES:
var matAdefault = [
  1,    0,    0.2,  0,
  0,    1,    0,    0.2,
  0,    0,    1,    0,
  0,    0,    0,    1
];

var matBdefault = [
  1,    0,    0,    0,
  0,    1,    0,    0,
  0,    0,    1,    0,
  0,    0,    0,    1
];

var matHdefault = [
  1,    0,    1,    0,
  0,    1,    0,    1,
  0,    0,    0,    0,
  0,    0,    0,    0
];

var matQdefault = [
  0,    0,    0,    0,
  0,    0,    0,    0,
  0,    0,    0.1,  0,
  0,    0,    0,    0.1
];

var matRdefault = [
  0.1,  0,    0,    0,
  0,    0.1,  0,    0,
  0,    0,    0.1,  0,
  0,    0,    0,    0.1
];


/*** SETUP FOR jQuery UI SLIDERS ***/
$(function() {
  // x-axis noise slider
  $("#x_noise_slider").slider({
    min: 0,
    max: 200,
    value: 0,
    slide: function(e, ui){
      X_NOISE = $("#x_noise_slider").slider('value');
      $("#x_noise_val").text("" + X_NOISE);
    },
    change: function(e, ui){
      X_NOISE = $("#x_noise_slider").slider('value');
      $("#x_noise_val").text("" + X_NOISE);
    }
  });

  // y-axis noise slider
  $("#y_noise_slider").slider({
    min: 0,
    max: 200,
    value: 0,
    slide: function(e, ui){
      Y_NOISE = $("#y_noise_slider").slider('value');
      $("#y_noise_val").text("" + Y_NOISE);
    },
    change: function(e, ui){
      Y_NOISE = $("#y_noise_slider").slider('value');
      $("#y_noise_val").text("" + Y_NOISE);
    }
  });

  // fade-out slider
  $("#fade_slider").slider({
    min: 1,
    max: 100,
    value: 20,
    slide: function(e, ui){
      FADE_OUT_TIME = ($("#fade_slider").slider('value'))/10.0;
      $("#fade_val").text("" + FADE_OUT_TIME.toFixed(1));
    },
    change: function(e, ui){
      FADE_OUT_TIME = ($("#fade_slider").slider('value'))/10.0;
      $("#fade_val").text("" + FADE_OUT_TIME.toFixed(1));
    }
  });

  // prediction slider
  $("#predict_slider").slider({
    min: 0,
    max: 20,
    value: 5,
    slide: function(e, ui){
      PREDICT_AMOUNT = ($("#predict_slider").slider('value')/10.0);
      $("#predict_val").text("" + PREDICT_AMOUNT.toFixed(1));
    },
    change: function(e, ui){
      PREDICT_AMOUNT = ($("#predict_slider").slider('value'))/10.0;
      $("#predict_val").text("" + PREDICT_AMOUNT.toFixed(1));
    }
  });
});


/*** ON DOCUMENT READY: start animation and setup event listeners ***/
$(document).ready(function() {
  // setup websocket
  var ws = new WebSocket("ws://localhost:8080/");
  ws.onmessage = function (event) {
    locMsg = event.data;
    loc = locMsg.split(",").map(function(str) {return parseFloat(str);});
    //console.log(locMsg);
    //console.log(loc);
    if (isNaN(loc[0]) || isNaN(loc[1])) {
      return;
    }
    updatePosition({X: loc[0] * 200 + 250, Y:loc[1] * 200 + 250});
  };

  // start animating the Kalman Filter simulation
  init();

  // if the user clicks in one of the input fields in the matrices,
  //	highlight all text inside of it
  $(".matrix td input").click(function(){
    $(this).select();
  });

  // if a user deselects (un-focuses) any of the matrix input fields,
  //	call the function to update the simulation values in that matrix.
  $(".matrix td input").blur(function(){
    if(!modifyValue($(this).attr("id"), $(this).val())) {
      alert("Invalid input: " + $(this).val());
    }
  });

  // if a user pressed "enter" on any of the matrix input fields,
  //	call the function to update the simulation values in that matrix.
  $('.matrix td input').keyup(function(event){
    if(event.keyCode == 13) {
      if(!modifyValue($(this).attr("id"), $(this).val())) {
        alert("Invalid input: " + $(this).val());
      }
    }
  });

  // call reset to initialize all matrix and slider values to their default
  resetValues();
});


// Modify one value of a given matrix. The matrix and which value to change
//	is contained in the "id" field, and its new value is in "val".
// This function filters out invalid input (i.e. non-numerical or
//	out-of-range indices).
// Returns TRUE if the matrix was updated, FALSE if not.
function modifyValue(id, val) {
  // make sure that "val" is a valid number
  if(isNaN(val))
    return false;
  val = parseFloat(val);

  var matID = id[0]; // matrix ID
  var posID = parseInt(id.substring(2)); // position in said matrix

  // check to make sure "pos" is a valid index into a 4x4 matrix
  if(isNaN(posID) || posID < 0 || posID > 15)
    return false;

  var row = Math.floor(posID / 4);
  var col = Math.floor(posID % 4);

  switch(matID) {
    case "A":
      A.elements[row][col] = val;
      break;
    case "B":
      B.elements[row][col] = val;
      break;
    case "H":
      H.elements[row][col] = val;
      break;
    case "Q":
      Q.elements[row][col] = val;
      break;
    case "R":
      // here, prevent any of the diagonals from being 0
      if(row == col && val == 0) {
        alert("This value cannot be 0.");
        return false;
      }
      R.elements[row][col] = val;
      break;
    default:
      return false;
  }

  return true;
}


// reset all five matrix and all slider values to default
function resetValues(){
  // default matrix values
  setMatrix("A", matAdefault);
  setMatrix("B", matBdefault);
  setMatrix("H", matHdefault);
  setMatrix("Q", matQdefault);
  setMatrix("R", matRdefault);

  // default slider values
  X_NOISE = 50;
  $("#x_noise_slider").slider('value', X_NOISE);
  $("#x_noise_val").text("" + X_NOISE);

  Y_NOISE = 50;
  $("#y_noise_slider").slider('value', Y_NOISE);
  $("#y_noise_val").text("" + Y_NOISE);

  FADE_OUT_TIME = 2;
  $("#fade_slider").slider('value', FADE_OUT_TIME*10);
  $("#fade_val").text("" + FADE_OUT_TIME.toFixed(1));

  PREDICT_AMOUNT = 0.5;
  $("#predict_slider").slider('value', PREDICT_AMOUNT*10);
  $("#predict_val").text("" + PREDICT_AMOUNT.toFixed(1));

  // set show prediction to checked and turn it on
  predictionOn = false;
  $("#predict_check").prop("checked", predictionOn);
}


// set all values of a given matrix to the given set (array) of values.
//	The given values, "vals", are expected to be valid numbers.
//	This function expects "vals" to have exactly 16 elements.
function setMatrix(id, vals) {
  // set up the matrix
  var curMatrix = $M([
    vals.slice(0, 4),
    vals.slice(4, 8),
    vals.slice(8, 12),
    vals.slice(12, 16)
  ]);

  // assign the matrix to the correct variable for the Kalman Filter
  switch(id) {
    case "A":
      A = curMatrix;
      break;
    case "B":
      B = curMatrix;
      break;
    case "H":
      H = curMatrix;
      break;
    case "Q":
      Q = curMatrix;
      break;
    case "R":
      R = curMatrix;
      break;
    default:
      return;
  }

  // display the new values in the matrix on the page
  for(var i=0; i<vals.length; i++) {
    $("#" + id + "_" + i).val(vals[i]);
  }
}


// pause or resume animation
function toggleAnimation() {
  running = !running;
  var toggleSpan = document.getElementById("on_or_off");
  if(running)
    toggleSpan.innerHTML = "Pause";
  else
    toggleSpan.innerHTML = "Resume";
}


// turn prediction on/off
function togglePrediction() {
  predictionOn = !predictionOn;
}


// restart the animation (re-randomize everything and restart animation)
function restart() {
  document.getElementById("on_or_off").innerHTML = "Pause";
  clearTimeout(animationHandle);
  init();
  resetValues();
}
