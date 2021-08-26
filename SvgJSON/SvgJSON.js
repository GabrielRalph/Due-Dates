import {SvgPlus, SvgPath, Vector} from "./3.5.js"
import {addProps} from "./JSONProps.js"

class SvgJSON extends SvgPlus{
  constructor(json, id, properties) {
    super(id);

    if (typeof properties !== "object" || properties == null) {
      this.invalid = true;
      return;
    }

    addProps(properties, json, this);
    if (this.onupdate instanceof Function) {
      this.onupdate();
    }
  }
}

export {SvgJSON, addProps}
