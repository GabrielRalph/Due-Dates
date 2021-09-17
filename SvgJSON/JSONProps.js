import {Vector} from "./3.5.js"

function isNumber(num) {
  return typeof num === "number" && !Number.isNaN(num);
}
function vectorFromString(str) {
  if (typeof str === "string") {
    let coords_cmr = str.split(",");
    let coords_spc = str.split(" ");
    let x = null;
    let y = null;
    if (coords_spc.length == 2) {
      x = parseFloat(coords_spc[0]);
      y = parseFloat(coords_spc[1]);
    }

    if (isNumber(x) && isNumber(y)) return new Vector(x, y);

    if (coords_cmr.length == 2) {
      x = parseFloat(coords_cmr[0]);
      y = parseFloat(coords_cmr[1]);
    }

    if (isNumber(x) && isNumber(y)) return new Vector(x, y);
    x = parseFloat(str);
    if (isNumber(x)) return new Vector(x, 0);
  }else if (isNumber(str)) return new Vector(str, 0);
  return null;
}

let Types = {
  number: {
    parse: (value) => {
      if (typeof value === "string") {
        value = parseFloat(value);
      }

      if (isNumber(value)) {
        return value;
      }
      return null;
    },
    default: -1,
    get: (v) => v,
  },
  vector: {
    parse: (value) => {
      if (value instanceof Vector) {
        return value;
      }
      return vectorFromString(value);
    },
    default: new Vector,
    get: (v) => v instanceof Vector ? v.clone() : v
  },
  string: {
    parse: (value) => {
      if (value == null || value == undefined) return null;
      return `${value}`;
    },
    default: "",
    get: (v) => v,
  },
  date: {
    parse: (value) => {
      if (value instanceof Date) return value;
      let date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
      return null;
    },
    default: () => new Date,
    get: (date) => new Date(date.getTime())
  },
  time: {
    parse: (value) => {
      if (value == null) return null;
      if (value instanceof Date) return value.getTime();
      let date = new Date(value);
      let time = date.getTime()
      if (!Number.isNaN(time) && time > 0) return time;
      return null;
    },
    default: -1,
    get: (v) => v,
  },
  bool: {
    parse: (value) => {
      return !!value;
    },
    default: false,
    get: (v) => v,
  },
  object: {
    parse: (value, prop) => {
      let properties = prop.properties;
      let obj = {};
      addProps(properties, value, obj);
      return obj;
    },
    default: () => {json: {}},
    get: (value) => value.json,
    getOverride: true,
  },
  array: {
    parse: (value, prop) => {
      let array = {
        values: [],
        keys: [],
        isObject: false,
        itemProp: null,
      };
      if ("item" in prop) {
        let itemProp = prop.item;
        array.itemProp = itemProp;
        if ("type" in itemProp) {
          let itemType = itemProp.type;
          if (Array.isArray(value)) {
            for (let item of value) {
              item = Types[itemType].parse(item, itemProp);
              array.values.push(item);
            }
          }else if (typeof value === "object" && value != null){
            array.isObject = true;
            for (let key in value) {
              let item = Types[itemType].parse(value[key], itemProp);
              array.values.push(item);
              array.keys.push(key);
            }
          }
        }
      }

      return array;
    },
    default: () => [],
    get: (value) => {
      let res = []
      let get = getGet(value.itemProp);
      if (value.isObject) {
        res = {};
        for (let i = 0; i < value.values.length; i++) {
          res[value.keys[i]] = get(value.values[i]);
        }
      }else{
        for (let item of value.values) {
          res.push(get(item));
        }
      }

      return res;
    },
    getOverride: true,
  },
};


function addProps(properties, json, obj, name = "json") {
  if (typeof properties !== "object" || properties == null) return;
  if (typeof json !== "object" || json === null) json = {};

  for (let name in properties) {
    let prop = properties[name];
    let value = name in json ? json[name] : null;
    setProp(name, prop, value, obj);
  }

  Object.defineProperty(obj, name, {
    get: () => {
      let json = {};
      for (let name in properties) {
        let prop = properties[name];
        let value = prop.default;
        json[name] = obj[name];
      }
      return json;
    },
  });
}

function setProp(name, prop, value, obj){
  if (typeof prop !== "object" || prop === null) return;
  if (!("type" in prop)) return;
  let type = prop.type;
  if (!(type in Types)) return;

  value = parseProp(value, prop);

  let get = getGet(prop);

  Object.defineProperty(obj, name, {
    get: () => {
      return get(value);
    }
  });
}

function getGet(prop) {
  let get = (v) => v;
  if ("type" in prop && prop.type in Types) {
    get = Types[prop.type].get;
    if ("get" in prop && prop.get instanceof Function && !Types[prop.type].getOverride) {
      get = prop.get;
    }
  }
  return get;
}

function parseProp(value, prop){
  if (value == undefined) value = null;
  let type = prop.type;

  //parse value by type
  value = Types[type].parse(value, prop);

  //range
  if ("range" in prop) {
    let range = prop.range;
    if (Array.isArray(range) && range.length == 2) {
      if (isNumber(value)) {
        if (value < range[0]) value = range[0];
        if (value > range[1]) value = range[1];
      }
    }
  }

  //default values
  if (value == null) {
    let def = Types[type].default;
    if ("default" in prop) {
      def = prop.default;
    }
    if (def instanceof Function){
      def = def();
    }
    value = def;
  }

  if ("validate" in prop) {
    let validate = prop.validate;
    if (validate instanceof Function) {
      value = validate(value);
    }
  }

  return value;
}

function makeProps(props, json) {
  let obj = {};
  addProps(props, json, obj);
  return obj;
}
function validate(props, json) {
  return makeProps(props, json).json;
}

export {addProps, makeProps, validate}
