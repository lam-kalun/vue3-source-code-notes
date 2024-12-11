// node中esm模块没有 __dirname、__filename、require
// 兼容node的方法
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import { createRequire } from "module";
// 获取文件的绝对路径（提供的是当前文件的完整路径，包括文件名）
const __filename = fileURLToPath(import.meta.url);
// 获取文件的目录路径（提供的是当前文件所在目录的路径，但不包括文件名）
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

import minimist from "minimist";
const args = minimist(process.argv.slice(2));
const target = args._[0] || "reactivity"; // 打包哪个项目
const format = args.f || "iife"; // 打包后的模块化规范

import esbuild from 'esbuild';
// 入口文件 根据命令行提供的路径来进行解析
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
const pkg = require(`../packages/${target}/package.json`);

esbuild
  .context({
    entryPoints: [entry], //入口
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`), //出口
    bundle: true, // reactivity -> shared 会打包到一起
    platform: "browser", // 打包后给浏览器使用
    sourcemap: true, //可以调试源代码
    format, // cjs esm iife
    globalName: pkg.buildOptions.name,
  })
  .then((ctx) => {
    console.log("start dev");
    return ctx.watch(); //监控入口文件持续进行打包处理
  });
