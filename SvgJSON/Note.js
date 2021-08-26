import {SvgPlus, SvgPath, Vector} from "./3.5.js"
import {SvgJSON} from "./SvgJSON.js"

let TAlign = {
  left: "end",
  right: "start",
  middle: "middle",
  default: "start"
}
let TAlignValues = {
  end: "end",
  start: "start",
  middle: "middle",
}

const NoteProps = {
  position: {
    type: "vector",
  },
  align: {
    type: "string",
    validate: (x) => {
      if (x in TAlignValues) {
        return x;
      }else if (x in TAlign){
        return TAlign[x];
      }else{
        return TAlign.default;
      }
    },
    default: TAlign.default
  },
  baseline: {
    type: "number",
    range: [-1, 2],
    default: 0.3,
  },
  rotation: {
    type: "number",
    default: 0,
  },
  scale: {
    type: "number",
    default: 1,
  },
  content: {
    type: "string",
  }
}
class Note extends SvgJSON{
  constructor(json){
    super(json, "text", NoteProps);
    this.class = "note"
  }

  async resize(){
    if (!this._content || this._content != this.content) {
      return new Promise((resolve, reject) => {
        this.innerHTML = this.content;
        // this.props = {styles:{"font-size": `${this.scale}em`}},
        window.requestAnimationFrame(() => {
          let bbox = this.getBBox();
          this._lastBBox = bbox;
          resolve(true);
        })
        this._content = this.content;
      });
    } else {
      let bbox = this.getBBox();
      this._lastBBox = bbox;
    }
  }
  get height(){
    return this._lastBBox.height;
  }

  async onupdate() {
    await this.resize();
    let pos = this.position;
    let baseline = this.baseline;
    let anchor = pos.addV(this.height * baseline);
    let ra = pos.mul(1-this.scale).div(this.scale);

    this.props = {
      x: anchor.x,
      y: anchor.y,
      "text-anchor": this.align,
      "transform-origin": `0 0`,
      "transform": `scale(${this.scale}) translate(${ra})`,
    }
  }
}

export {Note, TAlign, NoteProps}
