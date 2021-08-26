import {SvgPlus, SvgPath, Vector} from "./SvgJSON/3.5.js"
import {HuePicker} from "./SvgJSON/HuePicker.js"
import {SvgJSON, addProps} from "./SvgJSON/SvgJSON.js"
import {Icon} from "./SvgJSON/Icons.js"
import {DueDates, DueDateProps, DueDatesProps, datef} from "./DueDates.js"
import {Td, Tr, THead} from "./SvgJSON/TableSvg.js"
import {Wavey} from "./SvgJSON/Wavey.js"
import {FireUser, UserProps} from "./Firebase/FireUser.js"

class ToolWindow extends SvgPlus{
  constructor(app, show = false){
    super("div");
    this.app = app;
    this.class = "tool-window"

    this.styles = {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }
    let rel = this.createChild("div", {
      styles: {
        position: "relative"
      }
    })

    this.editIcon = new Icon("edit");
    rel.appendChild(this.editIcon);
    this.editIcon.styles = {
      position: "absolute",
      top: 0,
      right: 0
    }
    this.editIcon.onclick = () => {
      switch (this.editIcon.icon) {
        case "edit":
        this.shown = true;
        break;
        case "cross":
        this.shown = false;
        break;
      }
    }

    this.themePannel = new Themes(app.classes);
    this.themePannel.onedit = (path, value) => {this.save(path, value);};
    rel.appendChild(this.themePannel);


    this.ScheduleEditor = new ScheduleEditor(app.schedule);
    this.ScheduleEditor.onedit = (path, value) => {this.save(path, value);};
    this.appendChild(this.ScheduleEditor);

    this.rel = rel;
    this.instantShow = show;
  }

  onclick(){
    if (this.shown == false) this.shown = true;
  }

  set instantShow(value){
    this.pos = value ? 0 : 1;
    this._shown = value;
    this.styles = {overflow: value ? "scroll" : "hidden"}
    document.body.setAttribute("style", `overflow: ${value ? "hidden" : "scroll"};`)
    this.editIcon.icon = value ? "cross" : "edit";
    if (!value) this.themePannel.removeEditor();
    this.lock = value;
  }

  set pos(value) {
    this.styles = {
      "--full-offset": `calc(${value * 100}% - var(--offset) * ${value})`,
      transform: `translate(0, var(--full-offset))`
    }
  }

  set lock(value){
    this.styles = {
      cursor: value ? "auto" : "pointer"
    }
    this.rel.styles = {
      "pointer-events": value ? "auto" : "none",
    }
    this.editIcon.styles = {
      "pointer-events": "all"
    }
  }

  get shown() {return this._shown}
  set shown(value) {
    if (value != this.shown) {
      this.hide(!value);
    }
  }

  async hide(value) {
    if (this.__moving == true) return;
    this.lock = true;
    this._shown = !value;
    this.__moving = true;
    await this.waveTransition((t) => {
        this.pos = t;
    }, 1000, value);
    this.__moving = false;
    this.instantShow = this.shown;
  }

  save(path, value){
    if (this.onedit instanceof Function) {
      this.onedit(path, value)

    }
  }
}


class Themes extends SvgPlus {
  constructor(classes){
    super("div");
    this.class = "themes";
    this.firepath = "themes";
    this.themes = this.createChild("div", {class: "set"});
    this.classes = classes;
  }

  set classes(classes) {
    this.themes.innerHTML = "";
    for (let c of classes) {
      let el = this.themes.createChild("span", {class: c});
      el.innerHTML = c;
      el.onclick = () => {
        this.showEditor(c);
      }
    }
  }

  removeEditor(){
    if (this.editor) {
      if (this.contains(this.editor)) {
        this.removeChild(this.editor);
      }
    }
    this.editor = false;
  }

  showEditor(c) {
    this.removeEditor();
    this.editor = new ThemeEditor(c);
    this.editor.onedit = (name, theme) => {
      if (this.onedit instanceof Function) {
        this.onedit(`themes/${name}`, theme);
      }
      this.removeEditor();
    }
    this.editor.oncancel = () => {
      this.removeEditor();
    }
    this.appendChild(this.editor);
  }
}
class ThemeEditor extends SvgPlus {
  constructor(themeName){
    super("div");
    this.class = "theme-editor"
    this.themeName = this.createChild("span", {
      class: themeName,
      styles: {
        color: `hsl(var(--theme), 100%, 35%)`
      }
    })
    this.themeName.innerHTML = themeName;

    this.huePicker = this.createChild(HuePicker);
    this.huePicker.onmousemove = (e) => {
      if (e.buttons) {
        this.theme = this.huePicker.pointToHue(e);
      }
    }
    this.huePicker.onclick = (e) => {
      this.theme = this.huePicker.pointToHue(e);
    }
    this.huePicker.ontouchmove = (e) => {
      let t = e.touches[0];
      let v = new Vector(t.clientX, t.clientY);
      this.theme = this.huePicker.pointToHue(v);
    }

    this.tick = new Icon("tick");
    this.tick.styles = {fill: `hsl(var(--theme), 100%, 45%)`}
    this.tick.onclick = () => {
      this.save(themeName, this.theme);
    }

    this.cross = this.createChild(Icon);
    this.cross.icon = "cross";
    this.cross.onclick = () => {
      if (this.oncancel instanceof Function) this.oncancel();
    }
  }

  set theme(val){
    this.themeName.class = "";
    this._theme = val;
    this.styles = {"--theme": val};
    if (!this.contains(this.tick)) {
      this.appendChild(this.tick);
    }
  }

  get theme(){ return this._theme;}

  save(theme, value){
    if (this.onedit instanceof Function) {
      this.onedit(theme, value)
    }
  }
}
class ScheduleEditor extends SvgJSON {
  constructor(json) {
    super(json, "div", DueDatesProps);

    let date = new StartDateEditor(this.start);
    this.appendChild(date);
    date.onedit = (path, value) => {
      this.save(path, value);
    }

    this.createChild("h3").innerHTML = "Due Dates";
    this.createChild("p").innerHTML = "Add remove or edit, due dates will be displayed on the timeline"

    let duedates = new DueDatesEditor(this.dueDates);
    this.appendChild(duedates);
    duedates.onedit = (path, value) => {
      this.save(path, value);
    }
  }

  save(path, value) {
    path = `schedule/${path}`
    if (this.onedit instanceof Function) {
      this.onedit(path, value)
    }
  }
}
class DueDatesEditor extends SvgPlus{
  constructor(json) {
    super("table");
    this.class = "due-dates-editor"
    let th = new THead(1,5);
    let tr = th[0];
    tr[0].value = "Class";
    tr[1].value = "Name";
    tr[2].value = "Weight";
    tr[3].value = "Date/time or note";
    this.appendChild(th);

    for (let key in json) {
      let dd = new DueDateEditor(json[key], key)
      this.appendChild(dd);
      dd.onedit = (path, value) => {
        this.save(path, value);
      }
    }

    this.makeAdder();
  }


  makeAdder(){
    let addition = new DueDateEditor({}, "PUSHTOKEN");
    let foot = new THead(1, 5);
    foot[0][4].appendChild(new Icon("add"))
    foot[0][4].onclick = () => {
      if (this.contains(foot))  this.removeChild(foot);
      this.appendChild(addition);
      addition.focus();
    }
    addition.onleave = () => {
      if (this.contains(addition)) this.removeChild(addition);
      this.appendChild(foot);
    }
    addition.onedit = (path, value) => {
      this.save(path, value);
    }

    this.appendChild(foot);
  }



  save(path, value){
    if (this.onedit instanceof Function) {
      this.onedit(`dueDates/${path}`, value)
    }
  }
}
class DueDateEditor extends SvgPlus{
  constructor(json, id = null) {
    super("tbody");
    this.tr = new Tr(5);
    this.appendChild(this.tr);
    this.tr[4].props = {contenteditable: false}
    this.closei = new Icon("cross");
    this.savei = new Icon("tick");
    this.deletei = new Icon("trash");

    Object.defineProperty(this, "fireid", {
     value: id,
     writable: false
    });

    let obj = {};
    addProps(DueDateProps, json, obj);
    Object.defineProperty(this, "unedit", {
     get: () => obj.json
    });

    this.props = {contenteditable: true}

    this.initDisplay();
  }

  set display(value) {
    this.tr[0].value = value.class;
    this.tr[1].value = value.name;
    this.tr[2].value = value.weight + "%";
    if (value.date == -1) {
      this.tr[3].value = value.dateNote
    }else{
      this.tr[3].value = datef(value.date, false, false);
    }
    this.validateDate(value.date);
  }
  get display() {
    let text = {
      class: this.tr[0].text,
      name: this.tr[1].text,
      weight: this.tr[2].text,
      date: this.tr[3].text,
      dateNote: this.tr[3].text
    }
    let obj = {};
    addProps(DueDateProps, text, obj);
    return obj.json;
  }

  validateDate(date){
    if (date == -1) {
      this.tr[3].class = "invalid"
    }else{
      this.tr[3].class = "";
    }
  }

  compare(json, json2){
    for (let key in json) {
      if (json[key] != json2[key]) {
        if (key != "dateNote" || json.date === -1 ) {
          return false;
        }
      }
    }
    return true;
  }

  empty(json) {
    return json.class.length < 1 || json.name.length < 1;
  }
  initDisplay(){

    let unedit = this.unedit;
    this.display = unedit;

    this.closei.onclick = () => {
      this.display = unedit;
      this.blur();
      this.leave();
    }
    this.savei.onclick = () => {
      this.save(this.display);
      this.leave();
    }
    this.deletei.onclick = () => {
      this.save(null);
      this.leave();
    }

    this.addEventListener("focusin", (e) => {
      this.tr[4].appendChild(this.deletei);
    })

    this.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        var range = document.createRange()
        var sel = window.getSelection()
        var node = sel.anchorNode;
        while (node != null && !SvgPlus.is(node, Td) && node != this) node = node.parentNode;
        let selidx = 0;
        for (let i = 0; i < 4; i++) {
          if (this.tr[i] == node) {
            selidx = i;
            break;
          }
        }

        range.setStart(this.tr[(selidx + 1) % 4], 0)
        range.collapse(true)

        sel.removeAllRanges()
        sel.addRange(range)
      }
    })

    this.addEventListener("keyup", () => {
      let display = this.display;
      this.validateDate(display.date);
      console.log(this.compare(display, unedit));
      if (!this.compare(display, unedit) && !this.empty(display)) {
        this.tr[4].appendChild(this.savei);
        this.tr[4].appendChild(this.closei)
      }else{
        this.tr[4].value = "";
        this.tr[4].appendChild(this.deletei);
      }
    })

    this.addEventListener("focusout", () => {
      this.display = this.unedit;
      this.leave();
    })
  }

  leave(){
    this.tr[4].value = "";
    this.blur();
    if (this.onleave instanceof Function) {
      this.onleave();
    }
  }
  save(edit){
    if (this.onedit instanceof Function) {
      this.onedit(this.fireid, edit);
    }
  }
}
class StartDateEditor extends SvgPlus {
  constructor(date) {
    super("div");
    this.class = "start-date-editor";

    //make header
    let header = this.createChild("h3");
    header.innerHTML = "Start Date";
    let input = header.createChild("input");
    let displayDate = header.createChild("div");
    displayDate.innerHTML = datef(date, false, false);

    let close = new Icon("cross");
    let save = new Icon("tick");
    let validTime = -1;
    input.value = datef(date, false, false);

    let onchange = () => {
      let nd = new Date(input.value);
      let time = nd.getTime();

      if (Number.isNaN(time)) {
        input.class = "invalid";
        displayDate.innerHTML = "invalid";
      }else {
        displayDate.innerHTML = datef(time, false, false);
        input.class = "";
      }

      if (time == date) {
        if (header.contains(close)) header.removeChild(close);
      } else {
        if (Number.isNaN(time)) {
          if (header.contains(save)) header.removeChild(save);
        }else {
          header.appendChild(save)
          validTime = time;
        }
        header.appendChild(close);
      }
    }

    close.onclick = () => {
      input.value = datef(date, false);
      onchange();
    }

    input.onkeyup = onchange;

    //save clicked save
    save.onclick = () => {
      this.save(validTime);
    }
    let span = this.createChild("span");
    span.createChild("p").innerHTML = "The first day of you're schedule.";
    span.createChild("p").innerHTML = "Dates can be given in the<br /> forms dd mon yyyy hh:mm<br />or yyyy/mm/dd hh:mm";
  }

  save(date) {
    if (this.onedit instanceof Function) {
      this.onedit("start", date);
    }
  }
}


class UserPanel extends SvgJSON {
  constructor(user, fireUser) {
    super(user, "div", UserProps);
    this.class = "user-panel";
    this.fireUser = fireUser;
    if (this.uid == "demo") this.makeDemo();
    else this.makeUser();
  }

  makeDemo(){
    let head = this.createChild("h1")
    head.innerHTML = "Due Dates"
    let signin = head.createChild("p");
    signin.innerHTML = "Sign In"
    signin.onclick = () => {
      this.fireUser.signIn();
    }

    this.createChild("p").innerHTML = `Visualise assesment due dates on a true scale timeline.<br/>
                                       Sign in with gmail to add, remove, edit due dates and<br />
                                       set color themes for classes.`
  }

  makeUser(){
    let head = this.createChild("h1")
    head.createChild("img", {src: this.photoURL});
    head.innerHTML += this.displayName;
    let signin = head.createChild("p");
    signin.innerHTML = "Sign Out"
    signin.onclick = () => {
      this.fireUser.signOut();
    }
  }
}

let AppProps = {
  schedule: {
    type: "object",
    properties: DueDatesProps,
  },
  themes: {
    type: "array",
    item: {
      type: "string",
    }
  }
}

let UsersRef = "dueDates/users/";
class DueDatesApp extends SvgPlus{
  constructor(id) {
    super(id);
    let wavey = new Wavey;
    this.parentNode.appendChild(wavey);

    setTimeout(() => {
      this.fireUser = new FireUser();
      this.fireUser.onuser = (user) => {
        wavey.hide();
        this.uid = user.uid;
        this.user = user;
      }
      this.fireUser.onuserleave = () => {
        this.uid = null;
        this.user = {uid: this.uid}
        wavey.hide();
      }
      this.fireUser.watch();
    }, 3000)

  }



  set uid(uid){
    if (uid == null) {
      uid = "demo";
    }
    if ("sync-ref" in this) {
      this["sync-ref"].off();
    }
    this["sync-ref"] = firebase.database().ref("dueDates/users/" + uid);
    this["sync-ref"].on("value", (e) => {
      this.json = e.val();
    })
    this._uid = uid;
  }
  get uid(){
    return this._uid;
  }

  setThemesStyles(themes) {
    if (typeof themes !== "object" || themes == null) return;

    if (this.themeStyles == null) {
      this.themeStyles = document.createElement('style');
      this.themeStyles.type = 'text/css';
      document.getElementsByTagName('head')[0].appendChild(this.themeStyles);
    }

    this.themeStyles.innerHTML = "";
    for (let name in themes) {
      this.themeStyles.innerHTML += `.${name} {
        --theme: ${themes[name]}
      }`;
    }
  }

  set json(value) {
    let shown = false;
    if (this.toolWindow){
      shown = this.toolWindow.shown;
    }
    this.innerHTML = "";
    if (!shown) this.styles = {opacity: 0};

    let json = {};
    addProps(AppProps, value, json);
    json = json.json;
    if (Array.isArray(json.themes))json.themes = {};
    value = json;

    this.userPanel = new UserPanel(this.user, this.fireUser);
    this.appendChild(this.userPanel)

    this.dueDatesSvg = this.createChild("svg", {viewBox: "-50 -20 200 900"});
    this.dueDates = new DueDates(value.schedule);
    this.dueDatesSvg.appendChild(this.dueDates);
    window.requestAnimationFrame(() => {
      let bbox = this.dueDates.getBBox();
      let pad = 10;
      this.dueDatesSvg.props = {
        viewBox: `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + 2*pad} ${bbox.height + 4*pad}`
      }
    })


    this.toolWindow = new ToolWindow(this, shown);
    this.toolWindow.onedit = (path, value) => {
      if (this.uid == "demo") {
        this.warning();
      } else {
        this.save(path, value);
      }
    }
    this.appendChild(this.toolWindow);
    this.setThemesStyles(value.themes);

    if (!shown) {
      this.waveTransition((t) => {
        this.styles = {opacity: t};
      }, 500, true);
    }
  }

  async warning(){
    let warningBox = new SvgPlus("div");
    warningBox.class = "warning";
    warningBox.createChild("h1").innerHTML = "Sign in to make changes<br /> to your own schedule"
    warningBox.styles = {opacity: 0}
    this.appendChild(warningBox);
    await this.waveTransition((t) => {
      warningBox.styles = {opacity: t}
    }, 400, true)
    setTimeout(async () => {
      await this.waveTransition((t) => {
        warningBox.styles = {opacity: t}
      }, 700, false);
      this.removeChild(warningBox)
    }, 3000)
  }

  save(path, value) {
    path = `${UsersRef}${this.uid}/${path}`;
    if (value == null) {
      firebase.database().ref(path).remove();
    } else {
      if (path.indexOf("/PUSHTOKEN") != -1) {
        path = path.split("/PUSHTOKEN");
        let ref = firebase.database().ref(path[0]).push();
        ref.set(value);
      }else{
        firebase.database().ref(path).set(value);
      }
    }
  }

  get classes() {
    return this.dueDates.classes;
  }

  get schedule(){
    return this.dueDates.json;
  }
}




export {DueDatesApp}
