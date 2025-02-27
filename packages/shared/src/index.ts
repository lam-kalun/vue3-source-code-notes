export const isObject = (value) => {
  return typeof value === 'object' && value !== null;
};

export const isFunction = (value) => {
  return typeof value === "function";
};

export const isNumber = (value) => {
  return typeof value === 'number';
};

export const isString = (value) => {
  return typeof value === 'string';
};

export const isVNode = (value) => {
  return value ? value.__v_isVNode === true : false;
};

export * from './shapeFlags'