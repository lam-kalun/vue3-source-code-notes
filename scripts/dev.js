// node中esm模块没有 __dirname、__filename、require
// 兼容node的方法
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import { createRequire } from "module";
// 获取文件的绝对路径（提供的是当前文件的完整路径，包括文件名）
const __filename = fileURLToPath(import.meta.url);
// 获取文件的目录路径（提供的是当前文件所在目录的路径，但不包括文件名）
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

import minimist from "minimist";
const args = minimist(process.argv.slice(2));
const target = args._[0] || "reactivity"; // 打包哪个项目
const format = args.f || "iife"; // 打包后的模块化规范