const Year = (new Date).getUTCFullYear();
const Century = Math.floor(Year/100) * 100;
const Days = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
}
const DayOf2000 = 6;
const MonthNames = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
}
const Months = {
  "jan": 1,
  "feb": 2,
  "mar": 3,
  "apr": 4,
  "may": 5,
  "jun": 6,
  "jul": 7,
  "aug": 8,
  "sep": 9,
  "oct": 10,
  "nov": 11,
  "dec": 12
}
const MonthDays =      [31, 28, 31, 30,   31,  30,  31,  31,  30,  31,  30, 31];
const DaysTilMonth =   [31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
const DaysTilMonthLY = [31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];


function getDaysOfMonth(month, year) {
  if (month == 2 && year % 4 == 0) return 29;
  return MonthDays[month - 1];
}

function getDaysSince(date, t0 = 2000) {
  let days = 0;
  try {
    let year = date.year
    let y_delta = year - t0;
    if (y_delta < 0) throw 'before ' + t0;

    let ly_til_t0 = Math.floor((t0 - 1)/4);
    let ly_til_date = Math.floor((year - 1)/4);
    let lys = ly_til_date - ly_til_t0;
    days = (y_delta) * 365 + lys;

    let mi = date.month - 2;
    if (mi > 0) {
      if (year % 4 == 0) days += DaysTilMonthLY[mi];
      else days += DaysTilMonth[mi];
    }

    days += date.day;
  } catch(e) {
    days = null;
  }
  return days;
}

function getDayNumOfWeek(date, t0 = 2000, day0 = DayOf2000) {
  let days = getDaysSince(date, t0);
  if (days == null) return null;
  return (7 + (days - 1) + (day0 - 1)) % 7 + 1;
}

function getDayOfWeek(date, t0 = 2000, day0 = DayOf2000) {
  let daynum = getDayNumOfWeek(date, t0, day0);
  if (daynum == null) return null;
  return Days[daynum];
}

const TimeRegExp = /(1?\d|2[0-3]|0\d):([0-5]?\d)(:[0-5]?\d)?\s?(pm|am)?/
const DateRegExp = /(\d\d?)(?:(?:[^\d\w:]+)(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|[0-2]?\d))?(?:(?:[^\d\w:]+)(\d?\d?\d?\d))?/

class TimeVector {
  constructor(hours = 0, minutes = 0, seconds = 0, pm = false) {
    this.hours = hours;
    if (pm) this.hours += 12;
    this.minutes = minutes;
    this.seconds = seconds;
  }

  set hours(hours){
    if (typeof hours === "string") {
      hours = parseInt(hours);
    }

    if (typeof hours === "number") {
      if (Number.isNaN(hours)) hours = 0;
      hours = hours % 24;
    } else if (typeof hours !== "number"){
      hours = 0;
    }

    this._hours = hours;
  }
  get hours(){
    return this._hours;
  }

  set minutes(minutes) {
    if (typeof minutes === "string") {
      minutes = parseInt(minutes);
    }

    if (typeof minutes === "number") {
      if (Number.isNaN(minutes)) minutes = 0;
      minutes = minutes % 60;
    } else if (typeof minutes !== "number"){
      minutes = 0;
    }

    this._minutes = minutes;
  }
  get minutes(){
    return this._minutes;
  }

  set seconds(seconds) {
    if (typeof seconds === "string") {
      seconds = parseInt(seconds);
    }

    if (typeof seconds === "number") {
      if (Number.isNaN(seconds)) seconds = 0;
      seconds = seconds % 60;
    } else if (typeof seconds !== "number"){
      seconds = 0;
    }

    this._seconds = seconds;
  }
  get seconds(){
    return this._seconds;
  }

  static parse(string){
    let tmatch = string.match(TimeRegExp);
    let time = null;
    if (tmatch) {
      time = new TimeVector(tmatch[1], tmatch[2], tmatch[3], tmatch[4]);
    }
    return time
  }

  get ts() {
    let ts = this.seconds + this.minutes * 60 + this.hours * 60 * 60;
    return ts;
  }

  toString(pmam = true, seconds = false) {
    let hours = this.hours;

    if (pmam) {
      if (hours > 12) {
        pmam = " pm";
        hours -= 12;
      } else {
        pmam = " am";
      }
    } else {
      pmam = "";
    }

    let minutes = this.minutes + "";
    if (minutes.length < 2) minutes = "0" + minutes;

    //add seconds
    if (seconds) {
      seconds = "" + this.seconds;
      if (seconds.length < 2) seconds = "0" + seconds;
      seconds = ":" + seconds;
    } else {
      seconds = "";
    }

    return `${hours}:${minutes}${seconds}${pmam}`
  }

  clone(){
    return new TimeVector(this.hours, this.minutes, this.seconds)
  }
}

class DateVector {
  constructor(day = 1, month = null, year = null, time = null) {
    this.day = day;
    this.month = month;
    this.year = year;
    this.time = time;
  }

  get dayOfWeek(){
    return getDayOfWeek(this);
  }
  get dayNumOfWeek(){
    return getDayNumOfWeek(this);
  }

  set day(day){
    if (typeof day === "string") {
      day = parseInt(day);
    }

    if (typeof day === "number") {
      if (Number.isNaN(day)) {
        this._day = 0;
        throw "Day set to not a number."
      } else if (day <= 0 || day > 31) {
        this._day = 0;
        throw day +  " is not a valid day."
      }
    } else if (typeof day !== "number"){
      day = null;
    }

    this._day = day;
  }
  get day(){
    return this._day;
  }

  set month(month){
    if (typeof month === "string") {
      if (month in Months) {
        month = Months[month];
      } else {
        month = parseInt(month);
      }
    }

    if (typeof month === "number" && Number.isNaN(month)) {
      if (Number.isNaN(day)) {
        this._month = 0;
        throw "Month set to not a number."
      } else if (month <= 0 || month > 12) {
        this._month = 0;
        throw day +  "is not a valid month."
      }
      throw "Month set to not a number."
    } else if (typeof month !== "number"){
      month = null;
    }

    this._month = month;
  }
  get month(){
    return this._month;
  }

  set year(year){
    if (typeof year === "string") {
      year = parseInt(year);
    }

    if (typeof year === "number" && Number.isNaN(year)) {
      this._year = 0;
      throw "Year set to not a number."
    } else if (typeof year !== "number"){
      year = null;
    }

    this._year = year;
  }
  get year(){
    return this._year;
  }

  addDays(days) {
    let month = this.month;
    let year = this.year;

    let nmdays = getDaysOfMonth(month, year);
    let newday = this.day + days;
    while (newday > nmdays) {
      newday -= nmdays;
      month += 1;
      if (month == 13) {
        month = 1;
        year += 1;
      }
      nmdays = getDaysOfMonth(month, year);
    }
    return new DateVector(newday, month, year, this.time);
  }
  subDays(days) {
    console.log(days);
    let month = this.month;
    let year = this.year;

    let newday = this.day - days;
    while (newday < 1) {
      month -= 1;
      if (month == 0) {
        month = 12;
        year -= 1;
      }
      newday += getDaysOfMonth(month, year);
    }
    return new DateVector(newday, month, year, this.time);
  }

  static parseDate(date){
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getUTCFullYear();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let hours = date.getHours();
    // console.log(hours, minutes);
    return new DateVector(day, month, year, new TimeVector(hours, minutes, seconds))
  }

  get startOfWeek() {
    let day = this.dayNumOfWeek;
    if (day != null) {
      day = this.subDays(day - 1);
      day.time = new TimeVector(0);
    }
    return day;
  }
  get endOfWeek(){
    let day = this.dayNumOfWeek;
    if (day != null) {
      day = this.addDays(7 - day);
      day.time = new TimeVector(23, 59);
    }
    return day;
  }

  set time(value){
    if (value instanceof TimeVector) {
      this._time = value.clone();
    } else if (typeof value === "string"){
      this._time = TimeVector.parse(value);
    } else {
      this._time = null;
    }
  }
  get time(){
    let time = this._time;
    if (time instanceof TimeVector) {
      time = time.clone();
    }
    return time;
  }

  get timets() {
    let ts = 0;
    if (this.time instanceof TimeVector) ts = this.time.ts;
    return ts;
  }
  get ts(){
    let ts = null;
    let days = getDaysSince(this);
    if (days !== null) {
      ts = days * (60 * 60 * 24) + this.timets;
    }
    return ts;
  }

  static parse(string){
    let time = null;
    let date = null;
    if (typeof string === "string") {
      string = string.toLowerCase();
      let tmatch = string.match(TimeRegExp);
      if (tmatch) {
        time = new TimeVector(tmatch[1], tmatch[2], tmatch[3], tmatch[4]);
        string = string.replace(tmatch[0], "");
      }

      let match = string.match(DateRegExp);
      if (match) {
        date = new DateVector(match[1], match[2], match[3], time);
      }
    }
    return date;
  }

  apply(date) {
    for (let key of ["day", "month", "year", "time"]) {
      let value = this[key];
      if (value == null) {
        this[key] = date[key];
      }
    }
  }
  before(date) {
    // console.log(this.ts, );
    return this.ts < date.ts;
  }
  clone(){
    return new DateVector(this.day, this.month, this.year, this.time);
  }

  get isNull(){
    return this.day == null || this.month == null || this.year == null;
  }

  toString(short = false, year = Year != this.year, time = true){
    let ts = this.timets;
    if (!time || ts == null) {
      time = ""
    } else {
      time = " " + this.time;
    }

    if (short) {
      if (year && this.year != null) {
        year = "/" + this.year;
      } else {
        year = "";
      }

      return `${this.day}/${this.month}${year}${time}`
    } else {
      if (year && this.year != null) {
        year = " " + this.year;
      } else {
        year = "";
      }

      let day_of_week = getDayOfWeek(this);

      return `${day_of_week} ${this.day} ${MonthNames[this.month]}${year}${time}`
    }
  }
}

function addDateIntervals(dates, interval, inc = 7){
  let [date, dateb] = interval;
  dates.unshift(date);
  date = date.addDays(inc);
  while (date.before(dateb)) {
    dates.unshift(date);
    date = date.addDays(inc);
  }

  dates.unshift(dateb);
}

function parseDates(dateExp) {
  let dates = [];
  let exps = dateExp.split(/,|(-)/g);

  let date = null;
  let nextDate = null;
  while (exps.length > 0) {
    let nv = exps.pop();
    if (nv == "-" && date != null) {
      // get next valid date
      nextDate = DateVector.parse(exps.pop());
      while (nextDate == null && exps.length > 0) {
        nextDate = DateVector.parse(exps.pop());
      };

      // if there was a next valid date add inferred dats
      if (nextDate != null) {
        nextDate.apply(date);
        dates.shift();
        addDateIntervals(dates, [nextDate, date])
        date = nextDate;
      }

    } else {
      nextDate = DateVector.parse(nv);
      if (nextDate != null) {
        if (date == null) {
          if (nextDate.year == null) nextDate.year = Year;
          else if (nextDate.year < 100) nextDate.year += 2000;
        } else {
          nextDate.apply(date);
        }
        dates.unshift(nextDate);
        date = nextDate;
      }
    }
  }

  // dates.sort((a, b) => a.before(b) ? -1 : 1)
  return dates
}

const DURATIONS = {
  "h": 60 * 60,
  "hr": 60 * 60,
  "m": 60,
  "min": 60,
  "day": 24 * 60 * 60,
  "s": 1,
}

function parseDuration(string) {
  let s = 0;
  if (typeof string === "string") {
    const match = string.match(/(\d+)(\w+)?/);
    if (match) {
      s = parseInt(match[1]);
      if (match[2] && match[2] in DURATIONS) {
        s *= DURATIONS[match[2]]
      }
    }
  }
  return s;
}
export {parseDates, parseDuration, DateVector, Days, getDaysOfMonth}
