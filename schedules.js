import {SvgPlus} from "./SvgPlus/4.js"
import {Icon, Icons, FireFiles, Path} from "./FileTree/file-tree.js"
import {fireUser} from "./FireUser/fire-user.js"
import {DueDates} from "./DueDates/due-dates.js"
import {parseDates, parseDuration} from "./parseDates.js"
Icons["group"] = Icons["folder"]
Icons["dueDate"] = `<svg viewBox="0 0 93.26 110.62"><line class="cls-1" x1="4.5" y1="4.5" x2="4.5" y2="106.12"/><line class="cls-1" x1="4.5" y1="14.64" x2="29.35" y2="14.64"/><line class="cls-1" x1="4.5" y1="34.74" x2="29.35" y2="34.74"/><line class="cls-1" x1="4.5" y1="54.85" x2="29.35" y2="54.85"/><line class="cls-1" x1="4.5" y1="74.95" x2="29.35" y2="74.95"/><line class="cls-1" x1="4.5" y1="95.05" x2="29.35" y2="95.05"/><line class="cls-1" x1="4.5" y1="34.74" x2="56.09" y2="34.74"/><circle class="cls-1" cx="72.43" cy="34.74" r="16.33"/></svg>`;

console.log(new FireFiles());
class DDFiles extends FireFiles {
  constructor(user, path, ftree){
    super(user, path, ftree);
    this.childrenFilter = new Set(["info"]);
  }

  getShownDueDates(path){
    let dueDates = this.getValuesByType("dueDate", path);
    dueDates = dueDates.filter(d => this.isShown(d.path));
    return dueDates;
  }

  isShown(path){
    path = new Path(path);
    let shown = false;
    let data = this.data;
    for (let key of path) {
      data = data[key];
      shown = shown || "info" in data && data.info.shown;
    }
    return shown;
  }

  getColor(path){
    path = new Path(path);

    let color = null;
    let updateColor = (data) => {
      try {
        let c = data.info.color;
        if (c != "inherit" && c != "") {
          color = c;
        }
      } catch(e) {
      }
    }
    let data = this.data;
    updateColor(data);
    for (let key of path) {
      data = data[key];
      updateColor(data);
    }
    return color;
  }

  getOpacity(path){
    path = new Path(path);

    let opacity = 1;
    let updateColor = (data) => {
      try {
        let o = parseFloat(data.info.opacity);
        if (!Number.isNaN(o)) {
          if (o < 0) o = 0;
          if (o > 1) o = 1;
          opacity *= o;
        }
      } catch(e) {
      }
    }
    let data = this.data;
    updateColor(data);
    for (let key of path) {
      data = data[key];
      updateColor(data);
    }
    return opacity;
  }

  getIcon(path) {
    let type = this.getType(path);

    let icon = new SvgPlus("div");
    let color = this.getColor(path);
    icon.styles = {
      "--color": color,
    }
    let i = new Icon(type);
    i.styles = {
      opacity: this.getOpacity(path)
    }
    icon.appendChild(i);
    icon.createChild("div", {content: path.key})

    return icon;
  }

  typeOf(value, path){
    if (typeof value !== "object" || value == null) return null;
    if (path.isRoot) {
      return "folder";
    }



    if ("info" in value) {
      return "folder";
    } else {
      return "dueDate"
    }
  }
}

class Form extends SvgPlus {
  constructor(template) {
    super("form");
    this.innerHTML = template.innerHTML;
    let submit = this.querySelector("[submit]");
    if (submit) {
      submit.onclick = () => {
        const event = new Event("submit");
        this.dispatchEvent(event);
      }
    }

    let inputTable = {};
    let inputs = this.querySelectorAll("[name]");
    for (let input of inputs) {
      let name = input.getAttribute("name");
      if (name) {
        inputTable[name] = input;
        input.addEventListener("input", () => {
          this.toggleAttribute("invalid", !this.validate())
          const event = new Event("input");
          this.dispatchEvent(event);
        })
      }
    }
    this.inputTable = inputTable;
  }

  validate(data = this.value) {
    return true;
  }

  set value(obj) {
    if (typeof obj === "object" && obj !== null) {
      for (let key in this.inputTable) {
        // console.log(key);
        if (key in obj) {
          let input = this.inputTable[key];
          if (input.getAttribute("type") == "checkbox") input.checked = obj[key];
          else input.value = obj[key];
        }
      }
    }
  }

  get value(){
    let value = {};
    let isNull = true;
    for (let key in this.inputTable) {
      let input = this.inputTable[key];
      let val = input.getAttribute("type") == "checkbox" ? input.checked :input.value;
      if (typeof val === "string" && val.length > 0) isNull = false;
      value[key] = val;
    }
    if (isNull) {
      // console.log("null");
      value = null;
    }
    return value;
  }
}

export class Schedules extends SvgPlus {
  constructor(el, user) {
    super(el);
    let ftree = this.querySelector("file-tree");
    this.dueDates = this.querySelector("due-dates");
    this.ftree = ftree;
    let files = ftree.files;

    this.forms = new SvgPlus(this.querySelector(".forms"));
    this.getFormTeplates();
    this.showFormOptions("/");
    ftree.addEventListener("selection", (e) => {
      this.onSelection(e.filePath);
    });
  }

  getDueDates(path) {
    console.log("here101");
    console.log(path);
    let dueDateDesc = this.ftree.files.getShownDueDates(path);
    console.log("there101");
    console.log(dueDateDesc);
    let dueDates = [];
    for (let dueDate of dueDateDesc) {
      let datesString = dueDate.dates;
      if (typeof datesString === "string" && datesString.length > 0) {
        // get dates
        try {
          let dueDateDates = parseDates(datesString);
          dueDateDates.sort((a, b) => a.before(b) ? -1 : 1);

          // make due dates
          let n = dueDateDates.length;
          let i = 0;
          for (let date of dueDateDates) {
            i++;
            let title = dueDate.name;
            if (n > 1) title = title.replace(/s\s?$/g, "") + " " + i;
            dueDates.push({
              title: title,
              path: dueDate.path,
              date: date,
              ts: date.ts,
              color: this.ftree.files.getColor(dueDate.path),
              opacity: this.ftree.files.getOpacity(dueDate.path),
              duration: parseDuration(dueDate.duration)
            });
          }
        } catch (e) {

        }
      }
    }

    return dueDates;
  }

  onSelection(path) {
    if (this.ftree.files instanceof DDFiles) {
      this.styles = {
        "--selected-color": this.ftree.files.getColor(path)
      }
    }
    this.showFormOptions(path);
  }

  getFormTeplates() {
    let formTemplates = {};
    let forms = this.forms;
    for (let form of forms.children) {
      formTemplates[form.getAttribute("name")] = form;
    }
    this.formTemplates = formTemplates;
  }


  makeAddIcon(type, form){
    let icon = new Icon(type);
    let div = new SvgPlus("div");
    div.class = "add-icon"
    div.appendChild(icon);
    div.createChild("div", {content: "+"})

    div.onclick = () => {
      this.showForm(form);
    }
    return div;
  }


  showFormOptions(path) {
    let type = this.ftree.files.getType(path);
    path = new Path(path);

    this.forms.innerHTML = "";
    let options = new SvgPlus("div");
    options.class = "add-icons-box"
    if (type == "folder") {
      options.appendChild(this.makeAddIcon("folder", "Add Group"));
      if (!path.isRoot) {
        options.appendChild(this.makeAddIcon("dueDate", "Add Due Date"));
        this.showForm("Edit Group");
      }
    } else if (type == "dueDate") {
      this.showForm("Edit Due Date");
      return;
    }

    this.forms.prepend(options);
  }

  showForm(formName) {
    let form = new Form(this.formTemplates[formName]);

    form.addEventListener("submit", () => {
      this.submit(form, formName.toLowerCase());
    })

    this.forms.innerHTML = "";
    this.forms.appendChild(form);

    let isEdit = formName.toLowerCase().match("edit")
    if (isEdit) {
      let path = this.ftree.selectedPath;
      let data = this.ftree.files.get(path);
      if (typeof data === "object" && data != null) {
        if ("info" in data) {
          data = data.info;
        }
        data["name"] = path.key;
      } else {
        data = {};
      }
      form.value = data;
    }
  }

  submit(form, string){
    let data = form.value;
    let ftree = this.ftree;
    let files = ftree.files;
    let path = ftree.selectedPath;
    if (path == null) path = new Path("");

    if (data == null) {
      files.set(path, null);
    } else {
      let key = data.name;
      delete data.name;

      let isGroup = string.match("group");
      let isEdit = string.match("edit")
      if (isGroup) {
        data = {info: data}
      }
      if (isEdit) {
        if (key != path.key) {
          path = files.rename(path, key);
        }
        if (path != null) {
          files.update(path, data);
        }
      } else {
        console.log("set");
        path.push(key);
        files.set(path, data);
      }
    }
    this.forms.innerHTML = "";
    if (path != null) {
      ftree.selectedPath = path;
      ftree.update();
      console.log("Selection");
      this.onSelection(path);
    }

  }

  async load(user){
    let path = "schedule";
    let ftree = this.ftree;
    let files = new DDFiles(user, path, ftree);
    await files.watchFirebaseRoot();
    ftree.files = files;
    let dueDates = this.getDueDates("/");
    if (dueDates.length > 0) {
      this.dueDates.dates = dueDates
    }
    files.onfireUpdate = () => {
      let dueDates = this.getDueDates("/");
      if (dueDates.length > 0) {
        this.dueDates.dates = dueDates
      }
    }
    this.showFormOptions(ftree.selectedPath)
  }

}
