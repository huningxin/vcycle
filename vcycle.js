var VCycle = (function () {

  const x = 0;
  const y = 1;

  const config = {
    width: 400,
    height: 400,
    innerRadius: 150,
    outerRadius: 180,
    innerRadiusText: 154,
    arrowSizeBase: 60,
    arrowSizeLeg: 45,
    center: [195, 200],
    gradient: {
      steps: 100,
      centerStep: 20,
      startOpacity: 1.0,
      stopOpacity: 0
    },
    startDeg: 20,
    stopDeg: 200,
    styles: {
      arrow: "arrow",
      text: "text",
      slice: "slice"
    }
  };

  var rotatePre  = "rotate(";
  var rotatePost = "," + config.center[x] + "," + config.center[y] + ")";

  function round10(val) {
    return Math.round(val*10)/10;
  }

  function round(val, points) {
    return Math.round(val*100)/100;
  }

  function radialToXy(deg, center, radius) {
    return [round(center[x] + Math.cos(toRad(deg))*radius, 100), round(center[y] - Math.sin(toRad(deg))*radius, 100)];
  }

  function toRad(deg) {
    return deg*Math.PI/180;
  }

  function toDeg(rad) {
    return rad*180/Math.PI;
  }

  function addSlice(svg, parent, startDeg, stopDeg, opacity) {
    var path = svg.createPath();
    var p1 = radialToXy(startDeg, config.center, config.innerRadius);
    var p2 = radialToXy(startDeg, config.center, config.outerRadius);
    var p3 = radialToXy(stopDeg, config.center, config.outerRadius);
    var p4 = radialToXy(stopDeg, config.center, config.innerRadius);
    // make the arc
    path.move([p1])
        .line([p2])
        .arc(config.outerRadius, config.outerRadius, 0, false, false, p3[x], p3[y])
        .line([p4])
        .arc(config.innerRadius, config.innerRadius, 0, false, true, p1[x], p1[y]);
    svg.path(parent, path, {opacity: round(opacity, 100), class_: config.styles.slice});
  }

  function drawArrow(svg, parent) {
    var group  = svg.group(parent);
    var stepDeg = (config.stopDeg - config.startDeg)/config.gradient.steps;
    var stepOpacity;
    if (config.gradient.centerStep > (config.gradient.steps - config.gradient.centerStep)) {
      stepOpacity = (config.gradient.startOpacity - config.gradient.stopOpacity)/config.gradient.centerStep;
    }
    else {
      stepOpacity = (config.gradient.startOpacity - config.gradient.stopOpacity)/(config.gradient.steps - config.gradient.centerStep - 1);
    }
    // make center slice
    var centerDeg = config.startDeg + stepDeg*config.gradient.centerStep;
    // make center slice and clockwise slices
    var opacity = config.gradient.startOpacity;
    for (var deg = centerDeg; deg >= config.startDeg - 0.1; deg -= stepDeg) {
      addSlice(svg, group, deg, deg + stepDeg, opacity);
      opacity = opacity - stepOpacity;
    }
    var arrowOpacity = opacity;
    // make counter-clockwise slices
    opacity = config.gradient.startOpacity - stepOpacity;
    for (var deg = centerDeg + stepDeg; deg < config.stopDeg; deg += stepDeg) {
      addSlice(svg, group, deg, deg + stepDeg, opacity);
      opacity = opacity - stepOpacity;
    }
    // make the arrow head
    var path = svg.createPath();
    var p5 = radialToXy(config.startDeg, config.center, (config.innerRadius + config.outerRadius + config.arrowSizeBase)/2);
    var offsetDeg = 180 - toDeg(Math.acos(config.arrowSizeBase/(2*config.arrowSizeLeg)));
    var p6 = radialToXy(config.startDeg - offsetDeg,  p5, config.arrowSizeLeg);
    var p7 = radialToXy(config.startDeg, config.center, (config.innerRadius + config.outerRadius - config.arrowSizeBase)/2);
    path.move([p5]).line([p6, p7]).close();
    svg.path(group, path, {opacity: arrowOpacity});
    return group;
  }

  function addTextPath(svg, id) {
    var defs = svg.defs(); 
    var path = svg.createPath();
    var p1 = radialToXy(config.startDeg + 45, config.center, config.innerRadiusText);
    var p2 = radialToXy(config.startDeg, config.center, config.innerRadiusText);
    path.move([p1])
        .arc(config.innerRadiusText, config.innerRadiusText, 0, false, true, p2[x], p2[y]);
    svg.path(defs, path, {id: id});
  }

  function drawText(svg, parent, pathId) {
    var text = svg.text(parent, "", {class_ : config.styles.text});
    var texts = svg.createText().string("CONNECTIVITY");
    var textpath = svg.textpath(text, "#" + pathId, texts);
    return textpath;
  }

  function makeArrow(svg, parent, rotateDeg, pathId) {
    var group = svg.group(parent, {class_: config.styles.arrow, transform: "rotate(" + rotateDeg + "," + config.center[x] + "," + config.center[y] + ")"});
    drawArrow(svg, group);
    drawText(svg, group, pathId);
    return group;
  }

  function makeCycle(cycle) {
    var pathId = "textPath";
    var group = cycle.svg.group({id: "top", transform: "rotate(0" + "," + config.center[x] + "," + config.center[y] + ")"});
    addTextPath(cycle.svg, pathId);
    makeArrow(cycle.svg, group, 0, pathId);
    makeArrow(cycle.svg, group, 180, pathId);
  }

  function createCycle(cycle, canvasSelector, ready) {
    
    function init(svg) {
      cycle.svg = svg;
      svg._svg.setAttribute("viewBox", "0 0 " + config.width + " " + config.height);
      ready(cycle);
    }

    $(canvasSelector).svg({onLoad: init});
  }

  function Vcycle(domSelector) {
    this.domSelector = domSelector;
    this.rotation = 0;
    this.timer = null;
    createCycle(this, domSelector, makeCycle);
  }

  Vcycle.prototype.spin = function (speed) {

    var self = this;

    function rotate() {
      self.rotation += 2;
      $("#top", self.svg.root()).attr("transform", rotatePre + self.rotation + rotatePost);
    }

    if (this.timer != null) {
      clearInterval(this.timer);
    }
    if (speed > 0) {
      var timeoutValue = 1000/(10*speed);
      this.timer = setInterval(rotate, timeoutValue);
    }

    console.log("Spinning: " + speed);
  }

  return Vcycle;
})();

var webcamError = function(e) {
  alert('Webcam error!', e);
};

var webcam, canvasSource, canvasBlended, contextSource, contextBlended, lastImageData;
var canvasGrid, contextGrid;
var motion = false;

function initWebCam() {
  webcam = document.getElementById('webcam');
  canvasSource = document.getElementById('canvas-source');
  canvasBlended = document.getElementById('canvas-blended');

  contextSource = canvasSource.getContext('2d');
  contextBlended = canvasBlended.getContext('2d');

  navigator.webkitGetUserMedia({video: true}, function(stream) {
      webcam.src = window.URL.createObjectURL(stream);
      webcam.onplay = function() {
        motion = true;
      }
    }, webcamError);
  contextSource.translate(canvasSource.width, 0);
  contextSource.scale(-1, 1);

  drawAreas();
}

var frames = 0;

function update() {
  if (motion) {
    frames++;
    drawVideo();
    blend();
    checkAreas();
  }
  requestAnimationFrame(update);
}

function drawVideo() {
  contextSource.drawImage(webcam, 0, 0, webcam.width, webcam.height);
}

function fastAbs(value) {
  // funky bitwise, equal Math.abs
  return (value ^ (value >> 31)) - (value >> 31);
}

function threshold(value) {
  return (value > 0x15) ? 0xFF : 0;
}

function difference(target, data1, data2) {
  // blend mode difference
  if (data1.length != data2.length) return null;
  var i = 0;
  while (i < (data1.length * 0.25)) {
    target[4*i] = data1[4*i] == 0 ? 0 : fastAbs(data1[4*i] - data2[4*i]);
    target[4*i+1] = data1[4*i+1] == 0 ? 0 : fastAbs(data1[4*i+1] - data2[4*i+1]);
    target[4*i+2] = data1[4*i+2] == 0 ? 0 : fastAbs(data1[4*i+2] - data2[4*i+2]);
    target[4*i+3] = 0xFF;
    ++i;
  }
}

function differenceAccuracy(target, data1, data2) {
  if (data1.length != data2.length) return null;
  var i = 0;
  while (i < (data1.length * 0.25)) {
    var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
    var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
    var diff = threshold(fastAbs(average1 - average2));
    target[4*i] = diff;
    target[4*i+1] = diff;
    target[4*i+2] = diff;
    target[4*i+3] = 0xFF;
    ++i;
  }
}

var Configuraton = function() {
  this.showDetection = true;
  this.motionThreshold = 100;
  this.framesToSkip = 30;
  this.restructionSpeed = 0.05;

  this.lines = 8;
  this.columns = 8;
  this.top = 1;
  this.left = 1;
  this.right = 6;
  this.bottom = 3;
}

var config =new Configuraton();

function initGUI() {
  var gui = new dat.GUI();
  gui.add(config, 'showDetection').onFinishChange(function(value) {
    if (value) {
      canvasBlended.style.display = 'block';
      canvasGrid.style.display = 'block';
    } else {
      canvasBlended.style.display = 'none';
      canvasGrid.style.display = 'none';
    }
  });
  gui.add(config, 'motionThreshold', 10, 300).step(10);
  //gui.add(config, 'framesToSkip', 0, 100).step(1);
  gui.add(config, 'restructionSpeed', 0.0001, 0.1).step(0.0001);
  var f = gui.addFolder('Checking Area');
  f.add(config, 'lines', 2, 8).step(1).onFinishChange(function(){drawAreas();});
  f.add(config, 'columns', 2, 8).step(1).onFinishChange(function(){drawAreas();});
  f.add(config, 'top').min(0).max(7).step(1).onFinishChange(function(){drawAreas();});
  f.add(config, 'left').min(0).max(7).step(1).onFinishChange(function(){drawAreas();});
  f.add(config, 'right').min(0).max(7).step(1).onFinishChange(function(){drawAreas();});
  f.add(config, 'bottom').min(0).max(7).step(1).onFinishChange(function(){drawAreas();});
}

function drawAreas() {
  canvasGrid = document.getElementById('canvas-grid');
  contextGrid = canvasGrid.getContext('2d');

  contextGrid.clearRect(0, 0, canvasGrid.width, canvasGrid.height);

  contextGrid.strokeStyle = 'green';
  contextGrid.lineWidth = 2;

  for (var r=0; r<config.columns; ++r) {
    contextGrid.beginPath();
    contextGrid.moveTo(1/config.columns*r*canvasGrid.width, 0);
    contextGrid.lineTo(1/config.columns*r*canvasGrid.width, canvasGrid.height);
    contextGrid.stroke();
  }

  for (var l=0; l<config.lines; ++l) {
    contextGrid.beginPath();
    contextGrid.moveTo(0, 1/config.lines*l*canvasGrid.height);
    contextGrid.lineTo(canvasGrid.width, 1/config.lines*l*canvasGrid.height);
    contextGrid.stroke();
  }

  contextGrid.strokeStyle = 'red';
  contextGrid.lineWidth = 3;
  contextGrid.beginPath();
  contextGrid.strokeRect(1/config.columns*config.left*canvasGrid.width,
                       1/config.lines*config.top*canvasGrid.height,
                       1/config.columns*(config.right-config.left+1)*canvasGrid.width,
                       1/config.lines*(config.bottom-config.top+1)*canvasGrid.height);
}

var left = 0;
var right = 0;
var lastColumn = 0;
function checkSwipe(column) {
  if (column == 0) {
    lastColumn = column;
    return;
  }

  if (column > lastColumn) {    
    right++;
  } else if (column < lastColumn) {
    left++
  }

  lastColumn = column;

  if (right == 3 && left == 0) {
    console.log('swipe right');
    spinFaster();
    right = 0;
  } else if (left == 3 && right == 0) {
    console.log('swipe left');
    spinSlower();
    left = 0;
  } else if (left != 0 && right != 0) {
    left = 0;
    right = 0;
  }
}

function checkAreas() {
  if (frames < config.framesToSkip)
    return;
  else if (frames == config.framesToSkip)
    console.log('start checkAreas');
  // loop over the note areas
  var detected = 0;
  var sum = 0;
  for (var l=config.top; l<=config.bottom; ++l) {
    for (var r=config.left; r<=config.right; ++r) {
      var blendedData = contextBlended.getImageData(
            1/config.columns*r*webcam.width, 1/config.lines*l*webcam.height, webcam.width/config.columns, webcam.height/config.lines);
      var i = 0;
      var average = 0;
      // loop over the pixels
      while (i < (blendedData.data.length * 0.25)) {
        // make an average between the color channel
        average += (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]) / 3;
        ++i;
      }
      // calculate an average between of the color values of the note area
      average = Math.round(average / (blendedData.data.length * 0.25));
      if (average > config.motionThreshold) {
        //console.log('motion detecion at ' + r + ' ' + l);
        detected++;
        sum = sum + r;
      }
    }
  }
  if (detected > 0) {
    //console.log('checkAreas done, average = ' + sum / detected);
    checkSwipe(sum / detected);
  }
}

function blend() {
  var width = canvasSource.width;
  var height = canvasSource.height;
  // get webcam image data
  var sourceData = contextSource.getImageData(0, 0, width, height);
  // create an image if the previous image doesn’t exist
  if (!lastImageData) lastImageData = contextSource.getImageData(0, 0, width, height);
  // create a ImageData instance to receive the blended result
  var blendedData = contextSource.createImageData(width, height);
  // blend the 2 images
  differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
  // draw the result in a canvas
  contextBlended.putImageData(blendedData, 0, 0);
  // store the current webcam image
  lastImageData = sourceData;
}
