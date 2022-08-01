import {SvgPlus} from "../SvgPlus/4.js"

export class DueDates extends SvgPlus {


  set dates(dates) {
    console.log(dates);
  }
}


SvgPlus.defineHTMLElement(DueDates);
