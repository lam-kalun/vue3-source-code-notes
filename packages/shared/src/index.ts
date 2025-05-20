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

const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (val, key) => hasOwnProperty.call(val, key);

// 把value变为字符串
export const toDisplayString = (value) => {
  return isString(value) ? value : value == null ? '' : isObject(value) ? JSON.stringify(value) : String(value);
};

export * from './shapeFlags';
export * from './patchFlag';