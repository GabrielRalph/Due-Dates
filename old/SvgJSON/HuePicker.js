import {SvgPlus, SvgPath, Vector} from "./3.5.js"

let HuePickerHeight = 50;

class HuePicker extends SvgPlus{
  constructor() {
    super("svg");
    this.props = {
      class: "hue-picker",
      viewBox: "0 0 360 " + HuePickerHeight
    };
    this.draw();
  }

  pointToHue(p){
    if (!(p instanceof Vector)) p = new Vector(p);
    let bbox = this.getBoundingClientRect();
    let o = new Vector(bbox);
    let s = new Vector(bbox.width, bbox.height);
    let svgp = p.sub(o).div(s);
    svgp = svgp.mul(new Vector(360, HuePickerHeight));

    return Math.round(svgp.x);
  }

  draw() {
    this.innerHTML = "";
    for (let i = 0; i <= 360; i++) {
      let s = new Vector(i, 0);
      let e = s.addV(HuePickerHeight);
      this.createChild(SvgPath).M(s).L(e).styles = {
        stroke: `hsl(${i}, 100%, 50%)`,
        "stroke-width": 1.3,
      }
    }
  }
}

export {HuePicker}
