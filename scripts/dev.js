import minimist from "minimist";
const args = minimist(process.argv.slice(2));

const target = args._[0] || "reactivity"; // 打包哪个项目
const format = args.f || "iife"; // 打包后的模块化规范
console.log(target, format);


// node中esm模块没有 __dirname、__filename、require
// 兼容node的方法
import { fileURLToPath } from "url";
// 获取文件的绝对路径 file: -> /user
const __filename = fileURLToPath(import.meta.url);