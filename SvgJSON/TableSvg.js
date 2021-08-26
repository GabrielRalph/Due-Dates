import {SvgPlus, SvgPath, Vector} from "./3.5.js"

class Td extends SvgPlus{
  constructor(){
    super("td");
  }

  set value(val){
    this.innerHTML = val;
  }

  get text(){
    let getText = (el) => {
      if (el.nodeType == 3) {
        return el.data;
      }else {
        let text = "";
        for (let child of el.childNodes) {
          text += getText(child);
        }
        return text;
      }
    }
    return getText(this);
  }

  clear(){
    this.innerHTML = "";
  }
}
class Tr extends SvgPlus{
  constructor(cells){
    super("tr");
    for (let c = 0; c < cells; c++) {
      this[c] = this.createChild(Td)
    }
  }

  merge(cs, ce){
    if (ce > this.children.length - 1) return;
    if (cs > ce) return;
    this[cs].props = {colspan: ce - cs+1};
    while (ce > cs) {
      this.removeChild(this[ce]);
      this[ce] = this[cs];
      ce--;
    }
  }
}
class THead extends SvgPlus{
  constructor(r, c) {
    super('THEAD');
    for (let row = 0; row < r; row++) {
      this[row] = new Tr(c);
      this.appendChild(this[row])
    }
  }
}
class TBody extends SvgPlus{
  constructor(r, c) {
    super('TBODY');
    for (let row = 0; row < r; row++) {
      this[row] = new Tr(c);
      this.appendChild(this[row])
    }
  }
}

export {Td, Tr, THead, TBody}
