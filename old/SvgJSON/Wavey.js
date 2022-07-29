import {SvgPlus, SvgPath, Vector} from "./3.5.js"
import {Note} from "./Note.js"

class Vector3{
  constructor(x, y, z){
    this.x = x;
    this.y = y;
    this.z = z;
  }

  rotateZ(theta) {
    let x = this.x * Math.cos(theta) - this.y * Math.sin(theta);
    let y = this.x * Math.sin(theta) + this.y * Math.cos(theta);
    return new Vector3(x, y, this.z);
  }
  rotateY(theta) {
    let x = this.x * Math.cos(theta) + this.z * Math.sin(theta);
    let z = -this.x * Math.sin(theta) + this.z * Math.cos(theta);
    return new Vector3(x, this.y, z);
  }
  rotateX(theta) {
    let y = this.y * Math.cos(theta) - this.z * Math.sin(theta);
    let z = -this.y * Math.sin(theta) + this.z * Math.cos(theta);
    return new Vector3(this.x, y, z);
  }

  rotate(vec) {
    if (vec instanceof Vector3) {
      return this.rotateX(vec.x).rotateY(vec.y).rotateZ(vec.z);
    }
    return null;
  }

  add(b) {
    return new Vector3(this.x + b.x, this.y + b.y, this.z + b.y);
  }
  sub(b) {
    return new Vector3(this.x - b.x, this.y - b.y, this.z - b.y);
  }
  mul(b) {
    return new Vector3(this.x * b.x, this.y * b.y, this.z * b.y);
  }
  div(b) {
    return new Vector3(this.x / b.x, this.y / b.y, this.z / b.y);
  }

  toVector(){
    return new Vector(this.x, this.y);
  }
}

function waveToSvgPath(t, rotx, roty, rad, inc = 1) {
  let path = `<path class = 'wavey' d = `

  for (let x = -rad; x < rad; x+= inc){
    for (let y = -rad; y < rad; y+= inc) {
      if (x*x + y*y < 100) {
        let s = Math.sin(t)*10;
        let z = 3*Math.sin((1+Math.sin(t/10))*2.3*Math.sqrt(x*x + y*y + s*s))/Math.sqrt(x*x + y*y + s*s);
        let v = new Vector3(x,y,z);
        v = v.rotateZ(Math.PI*Math.sin(t/19)*2).rotateY(rotx).rotateX(roty)
        if (Number.isNaN(v.x)||Number.isNaN(v.y)||Number.isNaN(v.z)) {
          console.log("nan");
        }else{
          path += `M${v.x},${v.y}L${v.x},${v.y}`
        }
      }
    }
  }
  return path + "></path>";
}


class Wavey extends SvgPlus{
  constructor(){
    super("svg");
    this.class = "wavey"
    this.props = {viewBox: "-20 -20 20 20"};


    this.appendChild(new Note({
      position: "-10, -10",
      align: "middle",
      content: "Loading"
    }))

    let g = this.createChild("g");
    let t = (new Date()).getTime();
    let hide = false;
    this.hide = () => {hide = true;}
    let next = async () => {
      g.innerHTML = waveToSvgPath(t, Math.sin(t/4)*Math.PI/4, Math.cos(t/5)*Math.PI/5, 10, 0.5);
      t += 0.005;
      if (hide) {
        await this.waveTransition((t) => {
          this.styles = {opacity: t}
        }, 500, false)
        this.parentNode.removeChild(this)
      }else{
        window.requestAnimationFrame(next);
      }
    }
    next();
  }
}
export{Wavey}
