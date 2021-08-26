import {SvgPlus, SvgPath, Vector} from "./3.5.js"
import {SvgJSON} from "./SvgJSON.js"


const ThermometerProps = {
  start: {
    type: "vector",
  },
  end: {
    type: "vector",
  },
  center: {
    type: "vector",
    default: null
  },
  fullness: {
    type: "number",
    default: null
  },
}
class Thermometer extends SvgJSON{
  constructor(json){
    super(json, "g", ThermometerProps);

    this.class = "thermometer";
  }

  onupdate() {
    let center = this.center;
    let fullness = this.fullness;
    let start = this.start;
    let end = this.end;

    if (center != null && fullness == null) {
      let d1 = center.dist(this.start);
      let d2 = center.dist(this.end);
      fullness = d1 / (d1 + d2);
      center = null;
    }
    if (center == null && fullness != null) {
      center = this.end.mul(fullness).add(this.start.mul(1 - fullness));
    }

    if (center == null) center = start.add(end).div(2);

    let smidc = center.add(start).div(2);
    let emidc = center.add(end).div(2);

    this.innerHTML = "";
    this.createChild(SvgPath).M(start).L(end).props = {
      class: "back",
      styles: {"stroke-linecap": "round"}
    }
    this.createChild(SvgPath).M(start).L(smidc).props = {
      class: "full",
      styles: {"stroke-linecap": "round"}
    }
    this.createChild(SvgPath).M(smidc).L(center).class = "full";
    this.createChild(SvgPath).M(end).L(emidc).props = {
      class: "empty",
      styles: {"stroke-linecap": "round"}
    }
    this.createChild(SvgPath).M(emidc).L(center).class = "empty";
  }
}

export {Thermometer, ThermometerProps}
