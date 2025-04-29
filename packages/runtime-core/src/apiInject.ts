import { currentInstance } from "./component";

// P1 -> P2 -> P3
export const provide = (key, value) => {
  // 建立在组件基础上
  if (!currentInstance) {
    return
  }
  let provides = currentInstance.provides;
  const parentProvides = currentInstance.parent && currentInstance.parent.provides;
  // provides先直接复用parentProvides
  // 但是如果P2要再设置provide，为了不影响parentProvides
  // 第一次设置provide要基于parentProvides，另外新建一个对象，第二次就可以直接在新建的对象赋值了
  if (provides === parentProvides) {
    provides = currentInstance.provides = Object.create(parentProvides);
  }
  provides[key] = value;
};

export const inject = (key, defaultValue?) => {
  // 建立在组件基础上
  if (!currentInstance) {
    return
  }
  // 当前组件只能访问父级的设置的provides，不能访问自己设置的provides
  const parentProvides = currentInstance.parent && currentInstance.parent.provides;
  if (parentProvides && key in parentProvides) {
    return parentProvides[key];
  } else {
    return defaultValue;
  }
};