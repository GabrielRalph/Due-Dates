let DrawableProps = {
  vectors: {
    type: "array",
    item: {
      type: "vector",
    }
  },
  name: {
    type: "string",
  },
  type: {
    type: "string",
    default: "line"
  }
}
let GraphProps = {
  width: {
    type: "number",
    default: 300,
  },
  heigth: {
    type: "number",
    default: 200,
  },
  origin: {
    type: "vector",
  },
  type: {
    type: "string",
  },
  drawables: {
    type: "array",
    item: {
      type: "object",
      properties: DrawableProps,
    }
  },
  xInc: {
    type: "number",
    default: 1,
  },
  yInc: {
    type: "number",
    default: 1,
  }
}
