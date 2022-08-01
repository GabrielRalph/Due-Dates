import {SvgPlus} from "./SvgPlus/4.js"
import {Icon, Icons, Files, Path} from "./FileTree/file-tree.js"
import {fireUser} from "./FireUser/fire-user.js"
import {DueDates} from "./DueDates/due-dates.js"
import {parseDates, parseDuration} from "./parseDates.js"
Icons["group"] = Icons["folder"]
Icons["dueDate"] = `<svg viewBox="0 0 93.26 110.62"><line class="cls-1" x1="4.5" y1="4.5" x2="4.5" y2="106.12"/><line class="cls-1" x1="4.5" y1="14.64" x2="29.35" y2="14.64"/><line class="cls-1" x1="4.5" y1="34.74" x2="29.35" y2="34.74"/><line class="cls-1" x1="4.5" y1="54.85" x2="29.35" y2="54.85"/><line class="cls-1" x1="4.5" y1="74.95" x2="29.35" y2="74.95"/><line class="cls-1" x1="4.5" y1="95.05" x2="29.35" y2="95.05"/><line class="cls-1" x1="4.5" y1="34.74" x2="56.09" y2="34.74"/><circle class="cls-1" cx="72.43" cy="34.74" r="16.33"/></svg>`;

class DDFiles extends Files {
  constructor(user, path, ftree){
    super({});
    this.path = path;
    this.user = user;
    user.onValue(path, (e) => {
      let data = e.val();
      console.log(data);
      if (data == null) data = {}
      this.data = data;
      ftree.update();
    })
    this.childrenFilter = new Set(["info"]);
  }

  set(path, value) {
    super.set(path, value);
    path = new Path(path);
    path.unshift(this.path)
    this.user.set(path + "", value);
  }
  update(path, value) {
    if (typeof value === "object" && value != null) {
      super.update(path, value);
      path = new Path(path);
      path.unshift(this.path);
      this.user.update(path + "", value);
    }
  }

  getColor(path){
    path = new Path(path);

    let color = null;
    let updateColor = (data) => {
      try {
        let c = data.info.color;
        if (c != "inherit") {
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

  getIcon(path) {
    let type = this.getType(path);

    let icon = new SvgPlus("div");
    let color = this.getColor(path);
    icon.styles = {"--color": color}
    icon.appendChild(new Icon(type));
    icon.createChild("div", {content: this.getTitle(path)})

    return icon;
  }

  getType(path){
    let value = this.get(path);
    if (typeof value !== "object" || value == null) return null;

    path = new Path(path);
    if (path.isRoot) {
      return "group";
    }

    if ("info" in value) {
      return "group";
    } else {
      return "dueDate"
    }
  }

  isDirectory(path) {
    return this.getType(path) == "group";
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
          this.inputTable[key].value = obj[key];
        }
      }
    }
  }

  get value(){
    let value = {};
    for (let key in this.inputTable) {
      value[key] = this.inputTable[key].value;
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

  onSelection(path) {
    this.showFormOptions(path);
    let dueDates = this.ftree.files.getValuesByType("dueDate", path);
    let dates = [];
    for (let dueDate of dueDates) {
      let dueDateDates = parseDates(dueDate.dates);
      let n = dueDateDates.length;
      let i = 0;
      for (let date of dueDateDates) {
        i++;
        let title = dueDate.name;
        if (n > 1) title = title.replace(/s\s?$/g, "") + " " + i;

        dates.push({
          title: title,
          path: dueDate.path,
          date: date,
          color: this.ftree.files.getColor(dueDate.path),
          duration: parseDuration(dueDate.duration)
        });
      }
    }

    this.dueDates.dates = dates;
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
    if (type == "group") {
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

    console.log(path);

    let key = data.name;
    delete data.name;

    let isGroup = string.match("group");
    let isEdit = string.match("edit")
    if (isGroup) {
      data = {info: data}
    }
    if (isEdit) {
      if (key != path.key) {
        files.rename(path, key);
        path.pop();
        path.push(key);
      }
      files.update(path, data);
    } else {
      path.push(key);
      files.set(path, data);
    }
    ftree.update();

    this.forms.innerHTML = "";
  }

  async load(user){
    let path = "schedule";
    this.ftree.files = new DDFiles(user, path, this.ftree);
    this.ftree.update();
  }

}
