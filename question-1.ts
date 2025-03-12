// reactive里get不能直接用target[key]的原因
const person = {
  name: "欧兹",
  get aliasName() {
    return this.name + "rider";
  }
}

const proxyPerson = new Proxy(person, {
  get(target, key, receiver) {
    console.log(key); 
    // 只会触发aliasName一次，因为this.name相当于person.name，所以不会触发proxyPerson的get
    // 但是effect希望捕获所有依赖属性
    // 所以使用Reflect.get，使其this.name也能触发proxyPerson的get
    return target[key];
    // return Reflect.get(target, key, receiver);
  }
})

console.log(proxyPerson.aliasName);
