import { h } from './runtime-dom.js'

export default {
  setup() {
    return () => h('div', '我就是组件');
  }
}