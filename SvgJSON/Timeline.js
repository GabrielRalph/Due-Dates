import {SvgPlus, SvgPath, Vector} from "./3.5.js"
import {SvgJSON} from "./SvgJSON.js"
import {Thermometer, ThermometerProps} from "./Thermometer.js"
import {LineNote, LineNoteProps} from "./LineNote.js"

let Second = 1000;
let Minute = 60*Second;
let Hour = 60*Minute;
let Day = 24*Hour;
let Week = 7*Day;
let DeltaTime = [Second, Minute, Hour, Day, Week];

let toTimeUnit = (x) => {
  if (x == null) return -1;
  // for (let dt of DeltaTime) {
  //   if (x <= dt) {
  //     return dt;
  //   }
  // }
  return x;
}

let TimelineProps = {
  unit: {
    type: "number",
    validate: toTimeUnit,
    default: Week,
  },
  subUnit: {
    type: "number",
    validate: toTimeUnit,
    default: -1,
  },
  startTime: {
    type: "time",
    default: 0,
  },
  endTime: {
    type: "time",
    default: 0,
  },
  currentTime: {
    type: "time",
    default: 0,
  },
  includeEndTime: {
    type: "bool",
    default: true,
  },
  thermometer: {
    type: "object",
    properties: ThermometerProps
  },
  unitLabel: {
    type: "object",
    properties: LineNoteProps
  },
  subUnitLabel: {
    type: "object",
    properties: LineNoteProps
  },
}

function prefix(time, inc, unit){
  switch (unit) {
    case Day:
      let d = new Date(time);
      d = `${d}`;
      d = d.split(" ")[0];
      return d;
    case Week:
      return `W${inc + 1}`;
  }
  if (unit <  Minute) {
    let s = unit/Seconds;
    return `${s*inc}s`
  }
  if (unit < Hour) {
    let m = unit/Minute;
    return `${m*inc}m`
  }
  let h = unit/Hour
  return `${h*inc}h`
}

class Timeline extends SvgJSON{
  constructor(json){
    super(json, "g", TimelineProps);
    this.class = "timeline";
  }

  get deltaTime(){
    return this.endTime - this.startTime;
  }
  get fullDeltaTime(){
    return this.unit * this.increments;
  }
  get increments(){
    let n_incs = this.deltaTime/this.unit;
    if (this.includeEndTime) {
      return Math.ceil(n_incs);
    }else {
      return Math.floor(n_incs);
    }
  }
  get stopTime(){
    return this.startTime + this.increments * this.unit;
  }

  get ctime(){
    if (this.currentTime < this.startTime) return this.startTime;
    if (this.currentTime > this.endTime) return this.endTime;
    return this.currentTime;
  }


  timeToPosition(time) {
    if (typeof time === "string") {
      time = new Date(time)
    }
    if (time instanceof Date) {
      time = time.getTime();
    }
    let thermo = this.thermometer;
    let tr = (time - this.startTime) / this.fullDeltaTime;
    return thermo.start.mul(1 - tr).add(thermo.end.mul(tr));
  }

  updateThermometer(){
    if (this.thermo != false)
      this.removeChild(this.thermo);

    let thermo = this.thermometer;
    let fulln = (this.ctime - this.startTime) / (this.fullDeltaTime);
    thermo.fullness = fulln;
    this.thermo = new Thermometer(thermo)
    this.appendChild(this.thermo);
  }

  updateLabels(){
    if (this.labels == false)
      this.labels = this.createChild("g", {class: "labels"});

    let labels = this.labels;
    labels.innerHTML = "";
    let unitLabel = this.unitLabel;
    for (let i = 0; i <= this.increments; i++) {
      let time = this.startTime + this.unit * i;
      unitLabel.note.content = prefix(time, i, this.unit);
      unitLabel.position = this.timeToPosition(time);
      labels.appendChild(new LineNote(unitLabel));
    }
    if (this.subUnit == -1 || this.subUnit > this.unit) return;

    let sub = labels.createChild("g", {class: "sub"});
    let subLabel = this.subUnitLabel;
    for (let i = 0; i < this.increments; i++) {
      let time = this.startTime + this.unit * i;
      for (let j = 0; j < this.unit / this.subUnit; j++) {
        if (j != 0) {
          let stime = time + j * this.subUnit;
          subLabel.note.content = prefix(stime, i + j, this.subUnit);
          subLabel.position = this.timeToPosition(stime);
          sub.appendChild(new LineNote(subLabel));
        }
      }
    }
  }

  clear(){
    this.thermo = false;
    this.labels = false;
    this.innerHTML = "";
  }

  onupdate() {
    console.log(this.startTime);
    if (this.startTime < 0) return;
    this.clear();
    this.updateThermometer();
    this.updateLabels();
  }
}

export {Timeline, TimelineProps, Week, Day, Hour, Minute, Second}
