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


// CONSTANTS
var FPS = 10;
var PIX_SIZE = 4;

// Simulation Values:
var FADE_OUT_TIME = 10.0;
var PREDICT_AMOUNT = 1.0;

// drawing values
var canvas;
var ctx;
var xPos;
var yPos;
var coord;
var show = true;

// Kalman Filter Values:
var X_NOISE = 0;
var Y_NOISE = 0;

// Matrices
var A;
var B;
var H;
var Q;
var R;

var last_x;
var last_P;

var rPoints; // real points
var kPoints; // kalman points
var pPoints; // predicted points

// true if animation is currently going, false if stopped.
var running = true;
var predictionOn = true;
var animationHandle;


// Init: initialize all variables and starts animation
function init(){
        canvas = document.getElementById("kf_canvas");
        ctx = canvas.getContext("2d");
        xPos = 0;
        yPos = 0;

        A = $M([
                [1, 0, 0.2, 0],
                [0, 1, 0, 0.2],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
        ]);

        B = $M([
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
        ]);

        H = $M([
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
        ]);

        Q = $M([
                [0.001, 0, 0, 0],
                [0, 0.001, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
        ]);

        R = $M([
                [0.1, 0, 0, 0],
                [0, 0.1, 0, 0],
                [0, 0, 0.1, 0],
                [0, 0, 0, 0.1]
        ]);

        last_x = $V([0, 0, 0, 0]);

        last_P = $M([
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
        ]);

        rPoints = Array();
        kPoints = Array();
        pPoints = Array();

        running = true;
        predictionOn = true;
        animationHandle = setTimeout(frame, 1000/FPS);
}


/* Point class (prototype):
 *	Keeps track of a point, and it's current fade-out state.
 *	A point will automatically draw itself to the screen, and
 *	must be updated every frame. isAlive() will return false when
 *	this point has faded out completely.
 */
function Point(color) {
        this.x = 0;
        this.y = 0;
        this.lastX = 0;
        this.lastY = 0;

        // override values:
        this.color = color;
        this.duration = Math.round(FADE_OUT_TIME * FPS); // frames
        this.maxDuration = this.duration;

        // update timer
        this.update = function() {
                this.duration -= 1;
        }

        // returns FALSE if this point is done, ready to be removed
        this.isAlive = function() {
                return (this.duration > 0);
        }

        // draw a line segment from last point to current point onto the screen
        this.draw = function(ctx) {
                ctx.save();
                ctx.globalAlpha = (this.duration/this.maxDuration);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = PIX_SIZE;
                ctx.beginPath();
                ctx.moveTo(this.lastX, this.lastY);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
                ctx.restore();
                PrintGridlines();//print gridlines
                CoordValue();//print four coords
        }
}
/*
    print gridlines
*/
function PrintGridlines()
{
    ctx.lineWidth = 2;
    // print abscissa
    for( var i = 1; i * 30 < canvas.height; i++ ){
        ctx.globalAlpha=0.1;
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(0,i * 30);
        ctx.lineTo(canvas.width,i* 30);
        ctx.stroke();
        
        ctx.font="10px Arial";   
        var y_axis=i*30+"";  
        ctx.fillText(y_axis,10,i*30);    
    }
    //print ordinate
    for( var j = 1; j * 30 < canvas.width; j++ ){
        ctx.globalAlpha=0.1;
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(j * 30, 0);
        ctx.lineTo(j * 30, canvas.height);
        ctx.stroke();
        
        ctx.font="10px Arial";   
        var x_axis=j*30+"";  
        ctx.fillText(x_axis,j*30,20);   

    }
}
/*
    Print coord
*/
function PrintCoord(x,y)
{
    var word_x = parseInt(x)-10;
    var word_y = parseInt(y)-10;
    ctx.beginPath();
    ctx.strokeStyle = '#00FF00';
    ctx.strokeText(coord,word_x, word_y);
    ctx.arc(x,y,4,0,2*10);
    ctx.stroke();
    ctx.fillStyle = '#00FF00';
    ctx.fill();
}
function CoordValue() {
    for(var i=0;i<4;i++)
        {
            coord = "coord_"+i;
            var coordX = document.getElementsByName(coord)[0].value;
            var coordY = document.getElementsByName(coord)[1].value;
            //console.log(coordX);
            //console.log(coordY);
            PrintCoord(coordX,coordY); 
        }
}
/* 
    hide logo 
*/
function hide(){
    var hide_logo = document.getElementById("logo");
    var button_logo = document.getElementById("button");
    if(show)
        {
             hide_logo.setAttribute("style","display:none;");
             button_logo.innerHTML="show";
        }
    else 
        {
           hide_logo.setAttribute("style","display:block;");
            button_logo.innerHTML="hide";
        }
    show = !show;
}

/* RealPoint: display a point by the actual measurement (after noise) */
function RealPoint(x, y) {
        this.x = x;
        this.y = y;

        this.duration = Math.round(FADE_OUT_TIME * FPS); // frames
        this.maxDuration = this.duration;

        // draw just a color square to the screen (no lines)
        this.draw = function(ctx) {
                ctx.save();
                ctx.globalAlpha = (this.duration/this.maxDuration);
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - PIX_SIZE/2, this.y - PIX_SIZE/2, PIX_SIZE, PIX_SIZE);
                ctx.restore();
        }
}
RealPoint.prototype = new Point("#9999FF");


/* KalmanPoint: point to display the filtered value as determined
 *	by the Kalman Filter.
 */
function KalmanPoint(x, y) {
        this.x = x;
        this.y = y;

        this.duration = Math.round(FADE_OUT_TIME * FPS); // frames
        this.maxDuration = this.duration;

        // set last point if a previous KalmanPoint exists
        if(kPoints.length > 0) {
                this.lastX = kPoints[kPoints.length - 1].x;
                this.lastY = kPoints[kPoints.length - 1].y;
        }
        else {
                this.lastX = 0;
                this.lastY = 0;
        }
}
KalmanPoint.prototype = new Point("#00FF00");


/* PredictionPoint: point to display predicted value */
function PredictionPoint(x, y) {
        this.x = x;
        this.y = y;

        // set last point if a previous PredictionPoint exists
        if(pPoints.length > 0) {
                this.lastX = pPoints[pPoints.length - 1].x;
                this.lastY = pPoints[pPoints.length - 1].y;
        }
        // or else to the last Kalman point
        else if(kPoints.length > 0) {
                this.lastX = kPoints[kPoints.length - 1].x;
                this.lastY = kPoints[kPoints.length - 1].y;
        }
        // otherwise to the user's current position
        else {
                this.lastX = xPos;
                this.lastY = yPos;
        }
}
PredictionPoint.prototype = new Point("#FF0000");



/* frame(): update the Kalman Filter based on current position, and
 *	draw all simulated points/lines to the screen.
 */
function frame() {
        // if paused, just call for the next frame and return
        if(!running) {
                animationHandle = setTimeout(frame, 1000/FPS);
                return;
        }

        // clear screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // introduce some noise (if set)
        cur_xPos = xPos;
        cur_yPos = yPos;

        // add current position to the filter (after noise applied)
        rPoints.push(new RealPoint(cur_xPos, cur_yPos));


        /*** KALMAN FILTER CODE ***/
        var velX = cur_xPos - last_x.elements[0];
        var velY = cur_xPos - last_x.elements[1];

        var measurement = $V([cur_xPos, cur_yPos, velX, velY]);
        var control = $V([0, 0, 0, 0]); // TODO - adjust

        // prediction
        var x = (A.multiply(last_x)).add(B.multiply(control));
        var P = ((A.multiply(last_P)).multiply(A.transpose())).add(Q);

        // correction
        var S = ((H.multiply(P)).multiply(H.transpose())).add(R);
        var K = (P.multiply(H.transpose())).multiply(S.inverse());
        var y = measurement.subtract(H.multiply(x));

        var cur_x = x.add(K.multiply(y));
        var cur_P = ((Matrix.I(4)).subtract(K.multiply(H))).multiply(P);

        last_x = cur_x;
        last_P = cur_P;
        /**************************/

        kPoints.push(new KalmanPoint(cur_x.elements[0], cur_x.elements[1]));

        // run prediction for n frames (only if prediction is on):
        if(predictionOn) {
                var predX = last_x;
                var count = Math.round(FPS * PREDICT_AMOUNT);
                pPoints = Array();
                for(var i=0; i<count; i++){
                        predX = (A.multiply(predX)).add(B.multiply(control));
                        pPoints.push(new PredictionPoint(predX.elements[0], predX.elements[1]));
                        //var P = ((A.multiply(last_P)).multiply(A.transpose())).add(Q);
                }
        }


        // draw all real points
        for(var i=0; i<rPoints.length; i++) {
                rPoints[i].draw(ctx);
                rPoints[i].update();
                // if point faded out, remove it from the list
                if(!rPoints[i].isAlive()) {
                        rPoints.splice(i, 1);
                        i--;
                }
        }

        // draw all kalman points
        for(var i=0; i<kPoints.length; i++) {
                kPoints[i].draw(ctx);
                kPoints[i].update();
                // if point faded out, remove it from the list
                if(!kPoints[i].isAlive()) {
                        kPoints.splice(i, 1);
                        i--;
                }
        }

        // draw all prediction points if prediction is enabled
        if(predictionOn) {
                for(var i=0; i<pPoints.length; i++) {
                        pPoints[i].draw(ctx);
                }
        }

        // call next animation frame
        animationHandle = setTimeout(frame, 1000/FPS);
}



/* Called by mouse movement across the canvas:
 *	updates the current position of the cursor.
 */
function updatePosition(pos){
        // no position updates if animation is paused
        //console.log(pos);
        if(!running)
                return;

        // calculate the position offset of the Canvas on the web page
        var rect = canvas.getBoundingClientRect();
        var mouseX = pos.X;
        var mouseY = pos.Y;

        // update the cursor's x and y position
        xPos = Math.floor(mouseX);
        yPos = Math.floor(mouseY);
}
