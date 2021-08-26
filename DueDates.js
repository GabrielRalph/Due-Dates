import {SvgJSON, addProps} from "./SvgJSON/SvgJSON.js"
import {Timeline,TimelineProps, Week, Day} from "./SvgJSON/Timeline.js"
import {DotNote, DotNoteProps} from "./SvgJSON/DotNote.js"

let DueDateProps = {
  date: {
    type: "time",
    default: -1,
  },
  class: {
    type: "string",
    default: "",
  },
  name: {
    type: "string",
    default: "",
  },
  weight: {
    type: "number",
    range: [0, 100],
    default: 0,
  },
  dateNote: {
    type: "string",
    default: "",
  }
}
let DueDatesProps = {
  start: {
    type: "time",
  },
  dueDates: {
    type: "array",
    item: {
      type: "object",
      properties: DueDateProps
    },
  }
}
let StyleTemplates = {
  timeline: {
    type: "object",
    properties: TimelineProps
  },
  dotnote: {
    type: "object",
    properties: DotNoteProps,
  }
}

let DefaultStyleTemplate = {
  timeline: {
    unit: Week,
    subUnit: Day,
    unitLabel: {
      offset: "3",
      line: "-20, 0",
      note: { align: "left" },
      startOffset: "-2, 0",

    },
    subUnitLabel: {
      offset: "3",
      line: "-10, 0",
      note: { align: "left" },
      startOffset: "-2, 0",

    },
    thermometer: {
      start: "0, 0",
      end: "0, 800",
    },
  },
  dotnote: {
    offset: 4,
    rad: 1.5
  }
}


function datef(date, day = true, at = true){
  let d = new Date(date);
  d = (""+d).split(" ");
  let time = d[4];
  if (time === "00:00:00") time = "";
  else {
    time = time.split(":")
    time = (at ? " at " : "") + time[0] + ":" + time[1];
  }

  let res = `${d[2]} ${d[1]} ${d[3]} ${time}`;
  res = day ? `${d[0]} ` + res : res;
  return res;
}
function datenowf(date){
  let d = new Date(date);
  let now = new Date();
  let deltaDays = Math.floor((d.getTime() - now.getTime()) / Day);
  if (deltaDays >= 7 || now > d) {
    return datef(d);
  }else if (deltaDays < 7){
    if (deltaDays >= 2){
      return `in ${deltaDays} days`
    }else if (deltaDays > 0) {
      return `tommorow`
    }else{
      let hours = Math.floor((d.getTime() - now.getTime())/Hour);
      if (hours == 0) {
        let minutes = Math.floor((d.getTime() - now.getTime()) / Minute);
        return `in ${minutes} minutes`
      }else{
        return `in ${hours} hours`
      }
    }
  }
}

class DueDates extends SvgJSON{
  constructor(json, templates = DefaultStyleTemplate){
    super(json, "g", DueDatesProps);
    this.class = "due-dates";

    addProps(StyleTemplates, templates, this, "templates");
    let dds = this.dueDatesArray;

    if (dds.length < 1 || this.startTime == -1) {
      if (this.startTime == -1) {
        this.createChild("text").innerHTML = "Invalid start time"
      }else{
        this.createChild("text").innerHTML = "No due dates"
      }
      return;
    }
    dds.sort((a, b) => a.date > b.date ? 1 : -1);
    let end = dds[dds.length - 1].date;

    let timeline = this.templates.timeline;
    timeline.startTime = this.start;
    timeline.endTime = end;
    timeline.currentTime = new Date();
    timeline.includeEndTime = true;
    timeline.thermometer.end = "0 " + 9 * ((timeline.endTime - timeline.startTime) / Day)

    timeline = new Timeline(timeline)
    this.appendChild(timeline);
    let inc = timeline.subUnit;
    let invStart = timeline.stopTime + inc;
    let timeNow = timeline.currentTime;

    let last_dd = dds[0]
    for (let dd of dds) {

      let dotnote = this.templates.dotnote;
      let time = dd.date;
      dotnote.name = dd.class;
      dotnote.note.content = `<tspan class = "weight">${dd.weight}%  </tspan>
                              <tspan class = "name">${dd.name} </tspan>`
      if (time < 0) {
        invStart += inc;
        time = invStart;
      } else {
        if (last_dd.date < timeNow && time > timeNow) {
          dotnote.name += " next-assignment";
        }
        if (time < timeNow) {
          dotnote.name += " past"
        }
        let dist = time - timeNow;
        let mindspace = 4*Week;
        if (dist > 0 && dist < mindspace) {
          dotnote.note.scale = 1.6 - 0.6*dist / mindspace;
        }
        dotnote.note.content += `<tspan class = "due-text">due</tspan>
        <tspan class = "due" > ${datenowf(time)} </tspan>`
      }
      dotnote.position = timeline.timeToPosition(time);
      this.appendChild(new DotNote(dotnote))

      last_dd = dd;
    }
  }

  get dueDatesArray(){
    let dds = this.dueDates;

    //make sure duedates is array
    if (!Array.isArray(dds)) {
      let ddsa = [];
      for (let key in dds) ddsa.push(dds[key])
      dds = ddsa
    }

    return dds;
  }

  get classes(){
    let dds = this.dueDatesArray;
    let subjects = {};
    for (let dd of dds) {
      subjects[dd.class] = true;
    }
    return Object.keys(subjects);
  }
}

export {DueDates, DueDatesProps, DueDateProps, datef}
