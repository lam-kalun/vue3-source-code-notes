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

export * from './shapeFlags'