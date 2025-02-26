import { nodeOps } from './nodeOps';
import patchProp from './patchProp';
import { createRenderer } from '@vue/runtime-core';

const renderOptions = Object.assign({ patchProp }, nodeOps);

export const render = (vNode, container) => {
  return createRenderer(renderOptions).render(vNode, container);
};

export * from '@vue/reactivity';
export { renderOptions, createRenderer };