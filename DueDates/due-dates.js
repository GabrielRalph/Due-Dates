import {SvgPlus, Vector} from "../SvgPlus/4.js"
import {DateVector, Days, getDaysOfMonth} from "../parseDates.js"
import {DotNote} from "./dot-note.js"
const yext1 = 10;
const w1 = 4;
const t1 = 0.5;
const TCOLOR = "#b5b2b2";


function getScaleTiers(scale) {
  let value = 1/scale/(60 * 60);
  if (value < 0.25) {
    scale = 3;
  } else if (value < 4) {
    scale = 2;
  } else if (value < 15) {
    scale = 1;
  } else {
    scale = 0;
  }
  return scale;
}

function cap(value, min, max = Infinity, amin = min) {
  if (value > max) value = max;
  if (value < min) value = amin;
  return value;
}

function stepF(s, min, max, cutoff = min, c = 0.5) {
  let fs = 0;
  if (s > cutoff && s < min) fs = min;
  if (s > min) fs = min + (max - min) * (1 - Math.exp(-c * (s - min)));

  return fs;
}

class DueDateIcon extends SvgPlus {
  constructor(dueDate) {
    super("g");
    // this.iconBox = this.createChild("g");
    // this.textBox = this.createChild("g");

    // // let datestr = dueDate.date + ""
    // let title = `${dueDate.title}`;
    // // if (dueDate.weight) title = `${dueDate.weight}% ${title}`
    // this.textBox.createChild("text", {
    //   content: title,
    // });
    this.title = dueDate.title;
    this.color = dueDate.color;
    this.date = dueDate.date;
    this.duration = dueDate.duration;
    this.ts = dueDate.date.ts;
    this.opacity = dueDate.opacity;
  }


  render(scale, offset) {
    let strokeWidth = cap(scale * 5000, 0.2, t1);
    let width = w1;
    let slength = 5;

    let base = 5000 * scale;

    this.innerHTML = "";
    let yPos = (this.ts - offset) * scale;

    if (this.duration == 0) {
      let r = cap(base, strokeWidth * 2, width/2);
      this.appendChild(new DotNote({
        text: this.title,
        textSize: cap(10 * base, 3, 10, 0),
        offset: new Vector(slength + width + r * 2, 0),
        position: new Vector(-width/2, 0),
        offsetDotRadius: r,
        strokeWidth: strokeWidth,
        color: this.color,
        opacity: this.opacity
      }));
    } else {
      let dlength = this.duration * scale;
      dlength = cap(dlength, strokeWidth);
      this.createChild("path", {
        d: `M0,0L0,${dlength}`,
        "stroke-width": width,
        stroke: this.color,
        opacity: this.opacity
      })
      let size = cap(5 * base, 2, 7, 0)
      if (size > dlength) size = 0;
      this.appendChild(new DotNote({
        text: this.title,
        textSize: size,
        position: new Vector(width, dlength/2)
      }))
    }

    this.props = {
      transform: `translate(0, ${yPos})`
    }
  }
}

class DueDateIcons extends SvgPlus {
  constructor() {
    super("g");
  }

  set dates(dates) {
    if (Array.isArray(dates) && dates.length > 0) {
      dates.sort((a, b) => {return a.ts > b.ts ? 1 : -1});
      let start = dates[0].date.startOfWeek;
      let end = dates[dates.length - 1].date.endOfWeek;
      this.start = start.ts;
      this.end = end.ts;
      this.startDate = start;


      this.innerHTML = "";
      for (let dueDate of dates) {
        this.appendChild(new DueDateIcon(dueDate))
      }
    }
  }

  render(scale, offset) {
    for (let child of this.children) {
      child.render(scale, offset);
    }
  }
}

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * 60;
const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24;
const SECONDS_PER_WEEK = SECONDS_PER_DAY * 7;
const SECONDS_PER_QUARTER = 15 * SECONDS_PER_MINUTE;
const TIME_INCREMENTS = [SECONDS_PER_WEEK, SECONDS_PER_DAY, SECONDS_PER_HOUR, SECONDS_PER_QUARTER, SECONDS_PER_MINUTE]
const TIME_INCREMENT_NAMES = {
  60: "minute",
  900: "quarter",
  3600: "hour",
  86400: "day",
  604800: "week"
}

let fs_height = 7.3/7;
let fs_width = (21 / 4) / 7;

let day_length = fs_width * 5;

class TimeLine extends SvgPlus{
  constructor(el = "g") {
    super(el);
    this.barWidth = 4;
    this.maxStrokeWidth = 0.5;
    this.scale = 1 / SECONDS_PER_HOUR;
    this.weekMaxFontSize = 10;
    this.dayMaxFontSize = 7;
    this.minFontSize = 2;
  }

  get strokeWidth(){
    return stepF(this.scale * SECONDS_PER_DAY, 0, this.maxStrokeWidth, 0)
  }
  get weekBarLength(){
    let min = this.minFontSize * day_length;
    return stepF(2.2 * this.scale * SECONDS_PER_DAY, min, 35, 0, 0.1);
  }
  get dayBarLength(){
    let min = this.minFontSize * day_length;
    let max = this.dayMaxFontSize * day_length;
    return stepF(1.35 * this.scale * SECONDS_PER_DAY, min, max, 0, 0.08);
  }
  get hourBarLength(){
    return 10;
  }
  get quarterBarLength(){
    return 5;
  }



  add_week(seconds){
    let {weekBarLength, barWidth, strokeWidth, scale, totalSeconds, weekMaxFontSize, minFontSize} = this;
    let week = Math.floor(seconds/SECONDS_PER_WEEK)
    let dy = scale * SECONDS_PER_WEEK;
    let y = scale * seconds;

    let close = (seconds + SECONDS_PER_WEEK) == totalSeconds;
    let small = dy/7 < 2;
    let tsize = small ?  stepF(dy * 0.4, minFontSize, weekMaxFontSize) : stepF(dy/7, minFontSize, weekMaxFontSize);
    this.appendChild(new DotNote({
      text: "Week " + (week + 1),
      textAnchor: small ? "end" : "middle",
      textSize: tsize,
      rotation: small ? 0 : -90,
      position: new Vector(small ? -barWidth : -weekBarLength, y + dy/2)
    }))



    if (tsize > 0) {
      let bar = {
        offset: new Vector(-weekBarLength -barWidth, 0),
        position: new Vector(barWidth/2, y),
        strokeWidth: strokeWidth,
        color: TCOLOR
      }
      this.appendChild(new DotNote(bar));
      if (close) {
        bar.position = bar.position.addV(dy);
        this.appendChild(new DotNote(bar))
      }
    }
  }

  add_day(seconds) {
    let {dayBarLength, barWidth, strokeWidth, scale, minFontSize, dayMaxFontSize} = this;
    let day = Math.floor(seconds / SECONDS_PER_DAY);
    let date = this.startDate.addDays(day);
    seconds = day * SECONDS_PER_DAY;
    let string = date.dayOfWeek + " " + date.day;
    if (date.day == 1) {
      string = date.toString(false, false, false)
    }

    let dday = scale * SECONDS_PER_DAY;
    let y = scale * seconds;
    if (day > 0) {
      this.appendChild(new DotNote({
        offset: new Vector(-dayBarLength -barWidth, 0),
        position: new Vector(barWidth/2, y),
        strokeWidth: strokeWidth,
        color: TCOLOR
      }))
    }

    let big = dday/24 > 3;
    this.appendChild(new DotNote({
      position: new Vector(big ? -dayBarLength : -barWidth, y + dday/2),
      text: string,
      textSize: dayBarLength/day_length,
      textAnchor: big ? "middle" : "end",
      rotation: big ? -90 : 0,
    }))
  }

  add_hour(seconds) {
    let {hourBarLength, barWidth, strokeWidth, scale} = this;
    let hour = Math.round(seconds / SECONDS_PER_HOUR);
    seconds = hour * SECONDS_PER_HOUR;
    let y = scale * seconds;
    hour = hour % 24;

    if (hour == 0) return;

    let dhour = scale * SECONDS_PER_HOUR;
    this.appendChild(new DotNote({
      position: new Vector(barWidth/2, y),
      offset: new Vector(-hourBarLength -barWidth, 0),
      strokeWidth: strokeWidth,
      color: TCOLOR,
      text: hour > 12 ? ((hour - 12) + "pm") : (hour + "am"),
      textSize: stepF(dhour * 0.7, 2, 5)
    }))
  }

  add_quarter(seconds) {
    let {quarterBarLength, barWidth, strokeWidth, scale} = this;
    let quarter = Math.floor(seconds / SECONDS_PER_QUARTER);
    seconds = quarter * SECONDS_PER_QUARTER;
    let y = scale * seconds;
    quarter = quarter % 4;
    let hour = Math.floor(seconds / SECONDS_PER_HOUR) % 24;
    if (quarter == 0) return;

    let pmam = "am"
    if (hour > 12) {
      hour -= 12;
      pmam = "pm"
    }


    let dhour = scale * SECONDS_PER_HOUR;
    this.appendChild(new DotNote({
      position: new Vector(barWidth/2, y),
      offset: new Vector(-quarterBarLength -barWidth, 0),
      strokeWidth: strokeWidth,
      color: TCOLOR,
      text: `${hour}:${quarter*15}${pmam}`,
      textSize: stepF(dhour/8, 2, 4)
    }))
  }

  get bar_lengths(){
    return {
      week: 20,
      day: 12,
      hour: 6,
      quarter: 4,
    }
  }

  render_increments(startSeconds, endSeconds, minInc) {
    let totalSeconds = this.totalSeconds;
    for (let inc of TIME_INCREMENTS) {
      if (inc < minInc) break;
      let incName = TIME_INCREMENT_NAMES[inc];
      let add_inc = "add_" + incName;

      if (this[add_inc] instanceof Function) {
        let vStart = (Math.floor(startSeconds / inc) - 1) * inc;
        let vEnd = (Math.ceil(endSeconds / inc) + 1) * inc;
        vStart = cap(vStart, 0, totalSeconds);
        vEnd = cap(vEnd, vStart, totalSeconds);

        for (let seconds = vStart; seconds < vEnd; seconds+= inc) {
          this[add_inc](seconds)
        }
      }


    }
    // let str = "";
    // while (startSeconds % minInc != 0) startSeconds--;
    // for (let s = startSeconds; s < endSeconds; s += minInc) {
    //   if (s % SECONDS_PER_WEEK == 0) {
    //     this.add_week(s, 20);
    //     str += s/SECONDS_PER_WEEK + ", ";
    //   }
    //   console.log(minInc, SECONDS_PER_DAY);
    //   if (minInc <= SECONDS_PER_DAY && s % SECONDS_PER_DAY == 0) {
    //     this.add_day(s, 12);
    //   } else if (minInc <= SECONDS_PER_DAY && s % SECONDS_PER_HOUR == 0) {
    //     this.add_hour(s, 5);
    //   }
    // }
  }

  get nowSeconds(){
    let nowSeconds = DateVector.parseDate(new Date()).ts;
    return nowSeconds - this.start;
  }
  get totalSeconds(){
    let {end, start} = this;
    return Math.ceil((end - start) / SECONDS_PER_WEEK) * SECONDS_PER_WEEK
  }


  render_bar(){
    let {barWidth, strokeWidth, scale, totalSeconds, nowSeconds} = this;

    let path = `M0,0L0,${scale * totalSeconds}`;
    this.createChild("path", {
      d: path,
      "stroke-width": barWidth + 2 * strokeWidth,
      "stroke": TCOLOR,
      "stroke-linecap": "round"
    })
    this.createChild("path", {
      d: path,
      "stroke-width": barWidth,
      "stroke": "white",
    });

    this.createChild("path", {
      d: `M0,0L0,${nowSeconds * scale}`,
      "stroke-width": barWidth,
      "stroke": TCOLOR,
    })
  }

  choose_increment(height, scale = this.scale){
    let closestInc = null;
    let minSize = 4;
    for (let time_inc of TIME_INCREMENTS) {
      let size = time_inc * scale;
      if (size > minSize) {
        closestInc = time_inc;
      }
    }
    return closestInc;
  }

  render(scale = this.scale, start = this.start, end = this.end, vOffset, vHeight, startDate) {
    this.start = start;
    this.end = end;
    this.scale = scale;
    this.innerHTML = "";
    this.startDate = startDate;

    let vStart = vOffset / scale;
    let vEnd = vStart + vHeight / scale;

    let closestInc = this.choose_increment();

    vStart = (Math.floor(vStart / closestInc) - 1) * closestInc;
    vEnd = (Math.ceil(vEnd / closestInc) + 1) * closestInc;
    let totalSeconds = this.totalSeconds;
    if (vStart < 0) vStart = 0;
    if (vStart > totalSeconds) vStart = totalSeconds;
    if (vEnd < 0) vEnd = 0;
    if (vEnd > totalSeconds) vEnd = totalSeconds;

    this.render_bar();
    this.render_increments(vStart, vEnd, closestInc)
  }
}

export class DueDates extends SvgPlus {
  constructor(el){
    super(el)
    this.svg = this.createChild("svg")
    this.timeLine = this.svg.createChild(TimeLine);
    this.dueDateIcons = this.svg.createChild(DueDateIcons);
    this.scale = 8e-5;
    this.scOffset = -20;
    this.h = 200;
    this.xPos = 0;
    this.ySize = 0;

    let rendering = false;
    let next = () => {
      this.render();
      if (rendering) {
        window.requestAnimationFrame(next);
      }
    }
    this.start = () => {
      if (!rendering) {
        rendering = true;
        window.requestAnimationFrame(next);
      }
    }
    this.stop = () => {
      if (rendering) rendering = false;
    }
  }

  ontouchstart(e) {
    e.preventDefault();
  }

  ontouchmove(e){
    let n = e.touches.length;
    if (n == 1) {
      let t1 = e.touches[0];
      t1 = new Vector(t1.clientX, t1.clientY);
      if (!this.lastT1) this.lastT1 = t1;

      let delta = t1.sub(this.lastT1);
      this.scroll(-delta.y/5);
      this.lastT1 = t1;
    } else if (n == 2) {
      let t2 = e.touches[0];
      t2 = new Vector(t2.clientX, t2.clientY);
      if (!this.lastT2) this.lastT2 = t2;

      let t3 = e.touches[1];
      t3 = new Vector(t3.clientX, t3.clientY);
      if (!this.lastT3) this.lastT3 = t3;

      let ds1 = t2.dist(t3)
      let ds = this.lastT2.dist(this.lastT3);
      ds = (ds1/ds) - 1;

      let lastc = this.h * ((this.lastT2.y + this.lastT3.y) / 2 - this.yPos) / this.ySize;
      // alert(ds/10);
      let center = this.h * ((t2.y + t3.y)/2 - this.yPos) / this.ySize;
      this.scaleAtYPos(ds*2, center);
      this.scroll(lastc-center)
      this.scroll
      this.lastT2 = t2;
      this.lastT3 = t3;
    }
    e.preventDefault();
  }
  ontouchend(e){
    let n = e.touches.length;
    if (n == 0) {
      this.lastT1 = null;
    }

    if (n < 2) {
      this.lastT2 = null;
      this.lastT3 = null;
    }
  }

  scaleAtYPos(ds, y) {
    let oy = this.scOffset;
    if ((oy+y) > this.totalSeconds * this.scale) {
      y = this.totalSeconds * this.scale - oy;
    }
    if (oy + y < 0) y = -oy
    oy += (oy + y) * ds;
    this.scOffset = oy;

    this.scale *= (1 + ds);
    let maxy = this.totalSeconds * this.scale;
  }

  scroll(dy) {
    let oy = this.scOffset;

    let d1 = (oy + this.h*0.5) - this.totalSeconds * this.scale;
    if (d1 > 0) dy -= d1 * 0.3;

    let d2 = oy + this.h*0.5;
    if (d2 < 0) dy -= d2 * 0.3;
    this.scOffset += dy;
    // this.render();
  }


  onwheel(e){
    let ratio = (e.y - this.yPos) / this.ySize;
    let dx = e.deltaX;
    let dy = e.deltaY;
    if (Math.abs(dx) > Math.abs(dy)) {
      let ds = dx / 100;
      this.scaleAtYPos(ds, this.h * ratio)
    } else {
      dy = dy/10;
      this.scroll(dy);
    }
    e.preventDefault();
  }

  render(scale = this.scale, yoffset = 0, scrollOffset = this.scOffset) {
    if (scale * SECONDS_PER_DAY < 2) {
      scale = 2/SECONDS_PER_DAY;
    }

    let start = this.dueDateIcons.start;
    let end = this.dueDateIcons.end;

    let [pos, size] = this.bbox;
    this.yPos = pos.y;
    this.ySize = size.y;
    let height = 200 * size.y / size.x;
    this.h = height;
    this.totalSeconds = end - start;
    this.timeLine.render(scale, start, end, scrollOffset, height, this.dueDateIcons.startDate);
    this.dueDateIcons.render(scale, yoffset + start);
    this._rendering = false;
    this.svg.props = {
      viewBox: `-80 ${scrollOffset} 200 ${height}`
    }

  }

  set dates(dates) {
    this.dueDateIcons.dates = dates;
    this.start();

  }
}


SvgPlus.defineHTMLElement(DueDates);
