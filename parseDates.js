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
const MonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function getDaysOfMonth(month, year) {
  if (month == 2 && year % 4 == 0) return 29;
  return MonthDays[month - 1];
}

function getDaysSince2000(date) {
  let days = 0;
  try {
    let y_delta = date.year - 2000;
    if (y_delta < 0) throw 'before 2000';
    let n_leap_years = Math.floor((y_delta - 1) / 4) + 1;
    days = (y_delta) * 365 + n_leap_years;
    for (let i = 1; i < date.month; i++) {
      days += getDaysOfMonth(i, date.year);
    }
    days += date.day;
  } catch(e) {
    days = 0;
  }
  return days;
}

function getDayOfWeek(date) {
  let days = getDaysSince2000(date);
  let dow = (days + DayOf2000) % 7 + 1;
  return Days[dow] + " ";
}

function getSecondsSince2000(date) {
  let seconds = 0;
  let days = getDaysSince2000(date);
  if (days != 0) {
    seconds = days * (60 * 60 * 24) + date.timets;
  }
  return seconds;
}


class TimeVector {
  constructor(hours = 0, minutes = 0, seconds = 0) {
    this.hours = hours;
    this.minutes = minutes;
    this.seconds = seconds;
  }

  static parse(string){
    let str = null
    let match = string.match(/(1?\d|2[0-3]):([0-5]?\d)(:[0-5]?\d)?([^\w\d]+(pm|am))?/);
    let time = null;
    if (match) {
      str = match[0];
      let seconds = match[3] ? parseInt(match[3]) : 0;
      time = new TimeVector(parseInt(match[1]), parseInt(match[2]), seconds);
      if (match[4] == "pm") time.hours = (time.hours + 12)%24;
    }

    return [time, str]
  }

  get ts() {
    let ts = this.seconds + this.minutes * 60 + this.hours * 60 * 60;
    if (ts == null || Number.isNaN(ts)) ts = 0;
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
  constructor(day = null, month = null, year = null, time = null) {
    this.day = day;
    this.month = month;
    this.year = year;
    this.time = time;
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

  set time(value){
    this._time = value;
  }
  get time(){
    if (this._time instanceof TimeVector) {
      return this._time.clone();
    } else {
      return null;
    }
  }

  get timets() {
    let ts = 0;
    if (this.time instanceof TimeVector) ts = this.time.ts;
    return ts;
  }

  get ts(){
    return getSecondsSince2000(this);
  }

  static parse(string){
    this.string = string;
    string = string.toLowerCase();
    let date = new DateVector();
    let match = string.match(/\d\d?(?:[^\d\w:]|$)/);
    if (match) {
      date.day = parseInt(match[0]);
      string = string.replace(match[0], "");
    }

    match = string.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|[120]?\d)(?:[^\w\d:]|$)/);
    if (match) {
      let m = match[0].replace(/\s*/g, "");
      m = m in Months ? Months[m] : parseInt(m);
      date.month = m;
      string = string.replace(match[0], "")
    }

    let [time, str] = TimeVector.parse(string);
    if (time != null) {
      date.time = time;
      string = string.replace(str, "")
    }

    match = string.match(/\d{1,4}/)
    if (match) {
      let year = match[0];
      let n = year.length;
      year = parseInt(year)
      if (n < 4) {
         year += Century;
      }
      date.year = year;
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

  toString(short = false, year = Year != this.year, time = true){
    let ts = this.timets;
    if (!time || ts == 0) {
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

      return `${day_of_week}${this.day} ${MonthNames[this.month]}${year}${time}`
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

  let date = DateVector.parse(exps.pop());
  if (date.year == null) date.year = Year;
  // console.log(date + "");
  dates.push(date);
  while (exps.length > 0) {
    let nv = exps.pop();
    if (nv == "-") {
      let nextDate = DateVector.parse(exps.pop());
      nextDate.apply(date);
      dates.shift();
      addDateIntervals(dates, [nextDate, date])
      date = nextDate;
    } else if (nv) {
      let nextDate = DateVector.parse(nv);
      nextDate.apply(date);
      date = nextDate;
      dates.unshift(date);
    }
  }

  dates.sort((a, b) => a.before(b) ? -1 : 1)
  return dates
}

export {parseDates}
