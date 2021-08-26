import {SvgPlus, SvgPath, Vector} from "./3.5.js"
import {DotNote} from "./DotNote.js"
import {Thermometer} from "./Thermometer.js"
import {LineNote, TAlign} from "./LineNote.js"


class Graph extends SvgPlus{
  constructor(id, size){
    super(id);
    this.class = "graph"
    this.axis = this.createChild("g", {class: "axis"});
    this.size = size;
    this.graphPaths = this.createChild("g");
  }

  addLine(points, name){
    let path = new GraphPath(points);
    path.class = name.toLowerCase().replace(/ /g, "-");
    this.max = path.max;
    this.min = path.min;
    this.graphPaths.appendChild(path);
  }

  set viewbox(s) {
    this.props = {viewBox: s}
  }

  set max(v){
    if (this._max) {
      if (v.x > this._max.x) this._max.x = v.x;
      if (v.y > this._max.y) this._max.y = v.y;
    }else{
      this._max = v.clone()
    }
  }
  get max(){return this._max.clone()}
  set min(v){
    if (this._min) {
      if (v.x < this._min.x) this._min.x = v.x;
      if (v.y < this._min.y) this._min.y = v.y;
    }else{
      this._min = v.clone();
    }
  }
  get min(){return this._min.clone()}

  set size(value){
    if (value instanceof Vector) {
      this._size = value.clone();
    }
  }
  get size(){return this._size.clone()}
}


class GraphPath extends SvgPath{
  constructor(points){
    super("path");
    this.points = points;
  }

  set points(points) {
    if (Array.isArray(points) && points.length > 0) {
      points.sort((a, b) => {a.x > b.x ? 1 : -1})
      let init = false;
      let max = points[0].clone();
      let min = max.clone();
      this._points = [];
      for (let point of points) {
        if (point instanceof Vector) {
          this._points.push(point);

          if (point.x > max.x) max.x = point.x;
          if (point.y > max.y) max.y = point.y;
          if (point.x < min.x) min.x = point.x;
          if (point.y < min.y) min.y = point.y;
        }
      }
      this._min = min;
      this._max = max;
    }
  }
  get points(){
    return this._points;
  }

  get min(){
    return this._min.clone();
  }
  get max(){
    return this._max.clone();
  }

  draw(min, max, size) {
    if (min instanceof Vector && max instanceof Vector && size instanceof Vector) {
      let init = false;
      this.d.clear();
      let points = this.points.sort((a,b)=>{a.x > b.x ? 1:-1})
      for (let point of this.points) {
        let p = size.mul(point.sub(min).div(max.sub(min)));
        p.y = size.y - p.y;
        if (!init) {
          // console.log(point);
          this.M(p);
          init = true;
        }else{
          this.L(p);
        }
      }
      this.tmax = max;
      this.tmin = min;
    }
  }

  screenToSvg(s) {
    let svg = this.nearestViewportElement;
    let rect = svg.getBoundingClientRect();
    let soff = new Vector(rect);
    let ssize = new Vector(rect.width, rect.height);

    let vb = svg.getAttribute("viewBox").split(" ");
    let voff = new Vector(vb[0], vb[1]);
    let vsize = new Vector(vb[2], vb[3]);
    return s.sub(soff).mul(vsize).div(ssize).add(voff);
  }

  svgToPoint(v) {
    let svg = this.nearestViewportElement;
    v.y = svg.size.y - v.y;

    // console.log(this.tmax, this.tmin);
    return svg.max.sub(svg.min).mul(v.div(svg.size)).add(svg.min);
  }

  onmousemove(e) {
    let s = new Vector(e);
    let v = this.screenToSvg(s);
    let mind = -1;
    let minp;
    let cur = this.d.start;
    while (cur != null) {
      let d = cur.p.dist(v);
      if (mind < 0 || d <mind) {
        mind = d;
        minp = cur.p;
      }
      cur = cur.next;
    }
    let p = this.svgToPoint(minp)
    let specs = this.nearestViewportElement.specs;
    // console.log(specs);
    console.log(`${specs.xformat(p.x)} : ${specs.yformat(p.y)}`);
  }
}
