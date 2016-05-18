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
