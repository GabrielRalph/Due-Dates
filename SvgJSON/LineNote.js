import {SvgPlus, SvgPath, Vector} from "./3.5.js"
import {NoteProps, Note} from "./Note.js"
import {SvgJSON} from "./SvgJSON.js"


let LineNoteProps = {
  line: {
    type: "vector",
  },
  offset: {
    type: "number",
    default: 0,
  },
  "offset-vector": {
    type: "vector",
  },
  position: {
    type: "vector",
  },
  start: {
    type: "bool",
    default: true
  },
  note: {
    type: "object",
    properties: NoteProps
  },
  endRadius: {
    type: "number",
    default: 0,
  },
  startRadius: {
    type: "number",
    default: 0,
  },
  startOffset: {
    type: "vector",
  },
}

class LineNote extends SvgJSON{
  constructor(json){
    super(json, "g", LineNoteProps);
    this.class = "line-note"
  }


  onupdate(){
    this.innerHTML = "";

    let sr = this.startRadius;
    let er = this.endRadius;
    let voffset = this["offset-vector"];
    let start = this.position;
    let end  = start.add(this.line);

    this.createChild(SvgPath).M(start.add(this.startOffset)).L(end);

    let right = !this.start;
    let s1 = right ? end : start;
    let s2 = right ? start : end;
    let r = right ? er : sr;

    let dir = s1.sub(s2).dir().mul(this.offset + r);

    let note = this.note;
    note.position = voffset.add(s1.add(dir));
    this.appendChild(new Note(note));

    if (sr > 0) this.createChild("ellipse", {
      class: "start",
      cx: start.x,
      cy: start.y,
      rx: sr,
      ry: sr,
    })
    if (er > 0) this.createChild("ellipse", {
      class: "end",
      cx: end.x,
      cy: end.y,
      rx: er,
      ry: er,
    })
  }
}

export {LineNote, LineNoteProps}
