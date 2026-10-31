// 拼接单文件站点：head + style + hero + 七章 + 结语 + footer + demos.js
// 用法：node build/build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const style = read("build/style.css");
const hero = read("build/hero.html");
const chapters = ["ch1", "ch2", "ch3", "ch4", "ch5", "ch6", "ch7"]
  .map((n) => read(`build/${n}.html`)).join("\n");
const footer = read("build/footer.html");
const js = read("build/demos.js");

const head = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<meta name="theme-color" content="#ece4d2"/>
<link rel="preload" href="assets/fonts/wenkai-regular.woff2" as="font" type="font/woff2" crossorigin/>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' fill='%23ece4d2'/%3E%3Crect x='4' y='8' width='16' height='12' rx='1' fill='none' stroke='%232b5f5a' stroke-width='1.4'/%3E%3Cpath d='M4 8l8-4.5L20 8M4 8l8 4 8-4M12 12v8' fill='none' stroke='%232b5f5a' stroke-width='1.2'/%3E%3Cpath d='M9 12.5h6' stroke='%23a03b2a' stroke-width='1.4'/%3E%3C/svg%3E"/>
<meta name="description" content="把能力打包成技能：从一段私有提示词到一个可分发、可审计的能力包。SKILL.md 解剖、退出码契约、零依赖脚本、发布流水线与供应链治理，附四枚可玩小样。"/>
<meta name="author" content="StarrySea1412"/>
<meta property="og:title" content="把能力打包成技能 · 造物手记 VOL.07"/>
<meta property="og:description" content="80 行文档 + 239 行零依赖脚本，能力第一次离开作者。description 是最贵的五十个词。"/>
<meta property="og:type" content="article"/>
<meta property="og:image" content="assets/art/hero.webp"/>
<title>把能力打包成技能 · 造物手记 VOL.07</title>
<style>
${style}
</style>
</head>
<body>
<div class="progress" id="progress"></div>
`;
const tail = `
<script>
${js}
</script>
</body>
</html>
`;

const html = head + hero + "\n<main>\n" + chapters + "\n</main>\n" + footer + tail;
writeFileSync(join(root, "index.html"), html, "utf8");
console.log(`built index.html  ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
