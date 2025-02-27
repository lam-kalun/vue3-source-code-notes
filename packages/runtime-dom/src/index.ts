import { nodeOps } from './nodeOps';
import patchProp from './patchProp';
import { createRenderer } from '@vue/runtime-core';

const renderOptions = Object.assign({ patchProp }, nodeOps);

export const render = (vNode, container) => {
  return createRenderer(renderOptions).render(vNode, container);
};

// 私人醒的
export { renderOptions };
export * from '@vue/reactivity';
export * from '@vue/runtime-core';