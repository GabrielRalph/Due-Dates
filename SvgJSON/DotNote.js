import {SvgPlus, SvgPath, Vector} from "./3.5.js"
import {SvgJSON} from "./SvgJSON.js"
import {NoteProps, TAlign, Note} from "./Note.js"

let DotNoteProps = {
  offset: {
    type: "vector",
  },
  position: {
    type: "vector",
  },
  radius: {
    type: "number",
    default: 1
  },
  name: {
    type: "string",
    default: "",
  },
  note: {
    type: "object",
    properties: NoteProps
  }
}

class DotNote extends SvgJSON{
  constructor(json){
    super(json, "g", DotNoteProps);
    let name = this.name == null ? "" : this.name;
    this.class = "dot-note " + name
  }

  onupdate(){
    this.innerHTML = "";

    let pos = this.position;
    let rad = this.radius;
    let offset = this.offset;

    let note = this.note;

    let ellipse = this.createChild("ellipse", {
      cx: pos.x,
      cy: pos.y,
      rx: rad,
      ry: rad,
    })


    note.position = pos.add(offset.add(offset.dir().mul(rad)));
    this.appendChild(new Note(note));
  }
}

export {DotNote, DotNoteProps, TAlign}
