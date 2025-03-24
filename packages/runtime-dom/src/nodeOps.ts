// 主要对元素的增删改查
export const nodeOps = {
  // 将节点插入到parent节点里，anchor节点前（可不传）
  insert: (node, parent, anchor) => { parent.insertBefore(node, anchor || null); },
  // 移除节点
  remove: (node) => {
    const parent = node.parentNode;
    if (parent) {
      parent.removeChild(node);
    }
  },
  // 创建元素节点
  createElement: (type) => document.createElement(type),
  // 创建文本节点
  // 可传入文本类型数组
  createText: (text) => document.createTextNode(text),
  // 设置节点的值
  // 如果要设置元素节点的文本，因为文本始终位于文本节点内，所以必须返回文本节点的节点值：el.childNodes[0].nodeValue
  setText: (node, text) => { node.nodeValue = text; },
  // 设置元素节点的文本内容，或者所有后代
  setElementText: (el, text) => { el.textContent = text; },
  // 返回父节点
  parentNode: (node) => node.parentNode,
  // 返回同一树级别上的下一个节点
  nextSibling: (node) => node.nextSibling
};


/*
节点类型	nodeType	  示例	        是否可包含子节点	    在DOM树中的位置
元素节点	   1	    <h1></h1>	            是	       结构主体，可嵌套其他节点
文本节点	   3	    Hello World	          否	        元素节点的子节点
注释节点	   8	    <!-- 注释 -->	         否	          同级于元素节点
CDATA节点	  4	    <![CDATA[...]]>	        否	      仅XML，同级于元素节点
属性节点	   2	    id="title"	          否	          通过元素属性访问
文档节点	   9	      document	          是      （仅顶级元素）DOM树的根节点
*/